# Fee Mechanism Design - ERC20CommerceEscrowWrapper

## Overview

The `ERC20CommerceEscrowWrapper` implements a **Request Network Platform Fee** mechanism that is architecturally distinct from Commerce Escrow protocol fees. This document clarifies the design decisions, constraints, and future extensibility paths.

---

## Core Design Principles

### 1. Fee Type: Request Network Platform Fee

**NOT** a Commerce Escrow protocol fee. This is a service fee for using the Request Network platform/API infrastructure.

- **Commerce Escrow fees are intentionally bypassed** (set to `0 bps` with `address(0)` recipient)
- All fee handling is delegated to `ERC20FeeProxy` for Request Network event compatibility
- This architecture allows Request Network to monetize its payment infrastructure layer

### 2. Fee Payer: Merchant Pays (Subtracted from Capture)

**Current Implementation: Merchant-Pays-Fee Model**

```solidity
// In capturePayment() and _transferToMerchant():
uint256 feeAmount = (captureAmount * feeBps) / 10000;
uint256 merchantAmount = captureAmount - feeAmount;

// Result:
// - Merchant receives: captureAmount - feeAmount
// - Fee receiver gets: feeAmount
// - Payer authorized: captureAmount (unchanged)
```

#### Why Merchant Pays?

1. **Aligns with traditional payment processing** (Stripe, PayPal) - merchants pay fees
2. **Simplifies payer experience** - payers see and approve exact amount they'll pay
3. **No authorization amount manipulation** - amount authorized = amount debited from payer
4. **Predictable UX** - payer approves $100, pays exactly $100 (merchant receives $97.50 if 2.5% fee)

#### Example Flow:

```
Payer authorizes: 1000 USDC
Platform fee: 250 bps (2.5%)
Fee amount: 25 USDC
Merchant receives: 975 USDC
Fee recipient receives: 25 USDC
```

### 3. Fee Recipients: Single Recipient Per Operation

**Current Implementation: One `feeReceiver` address**

```solidity
function capturePayment(
  bytes8 paymentReference,
  uint256 captureAmount,
  uint16 feeBps,
  address feeReceiver // Single recipient
) external;

```

#### Rationale:

- **Simplicity**: One fee parameter, one recipient
- **Gas efficiency**: Single transfer operation via `ERC20FeeProxy`
- **Flexibility preserved**: `feeReceiver` can be a **fee-splitting smart contract**

#### Future Extensibility:

If multiple fee recipients are needed (e.g., Request Network API fee + Platform operator fee):

**Option A: Fee Splitter Contract (Recommended)**

```solidity
// Deploy a FeeDistributor contract:
contract FeeDistributor {
    address public requestNetworkTreasury;
    address public platformOperator;
    uint16 public requestNetworkBps;  // e.g., 150 bps (1.5%)
    uint16 public platformBps;        // e.g., 100 bps (1.0%)

    function distributeFees() external {
        // Split received fees according to bps
    }
}

// Use in capturePayment:
capturePayment(ref, amount, 250, address(feeDistributor));
```

**Option B: Protocol Upgrade (Future Enhancement)**

```solidity
struct FeeConfig {
  uint16 requestNetworkFeeBps;
  address requestNetworkFeeReceiver;
  uint16 platformFeeBps;
  address platformFeeReceiver;
}

function capturePayment(
  bytes8 paymentReference,
  uint256 captureAmount,
  FeeConfig calldata fees
) external;

```

This would be a **breaking change** requiring:

- New contract deployment
- Migration of existing payments
- Updated integration documentation

**Recommendation**: Use **Option A** (fee splitter contract) for near-term needs. Reserve **Option B** for major protocol version upgrade.

---

## Fee Calculation Details

### Formula

```solidity
feeAmount = (captureAmount * feeBps) / 10000
merchantAmount = captureAmount - feeAmount
```

### Basis Points (bps) Scale

- `0 bps` = 0% (no fee)
- `100 bps` = 1.0%
- `250 bps` = 2.5% (typical credit card fee)
- `500 bps` = 5.0%
- `10000 bps` = 100% (maximum allowed)
- `> 10000 bps` = **Reverts with `InvalidFeeBps()` error**

### Integer Division Rounding

```solidity
// Solidity integer division truncates toward zero
1001 wei @ 250 bps = (1001 * 250) / 10000 = 250250 / 10000 = 25 wei
// Not 25.025 - merchant gets 976 wei (slight favor to merchant)

1000 wei @ 333 bps = (1000 * 333) / 10000 = 33 wei (not 33.3)
// Merchant gets 967 wei
```

**Impact**: Rounding always favors the merchant by truncating fractional fees. On small amounts, this can be significant:

- $0.01 @ 2.5% = $0.00025 → rounds to $0.00 (no fee collected)
- $1.00 @ 2.5% = $0.025 → rounds to $0.02 (20% fee undercollection)
- $100.00 @ 2.5% = $2.50 → exact (no rounding)

**Mitigation**: Platforms should consider minimum fee amounts for micro-transactions.

---

## Alternative Model: Payer-Pays-Fee

### Why NOT Implemented?

**Payer-pays-fee** would require the payer to authorize `(amount + fee)`:

```solidity
// Hypothetical payer-pays model:
Payer authorizes: 1025 USDC  // amount + fee
Merchant receives: 1000 USDC
Fee recipient receives: 25 USDC

// Problem: Payer experience is confusing
// User approves $1000 payment, but $1025 is deducted from their wallet
```

### Challenges:

1. **UX Confusion**: "I approved $1000, why was $1025 taken?"
2. **Authorization complexity**: Wrapper would need to calculate `amount + fee` upfront
3. **Fee changes**: If `feeBps` changes between authorization and capture, payer could pay wrong amount
4. **Regulatory issues**: Some jurisdictions require exact amount disclosure to payers

### Implementation Path (If Needed):

```solidity
struct AuthParamsWithFee {
    // ... existing params ...
    uint256 payerAmount;     // Amount payer approves (e.g., 1025)
    uint256 merchantAmount;  // Amount merchant receives (e.g., 1000)
    uint16 feeBps;           // Fee for validation
    address feeReceiver;
}

function authorizeWithPayerFee(AuthParamsWithFee calldata params) external {
    // Validate: payerAmount = merchantAmount + (merchantAmount * feeBps / 10000)
    uint256 expectedFee = (params.merchantAmount * params.feeBps) / 10000;
    require(params.payerAmount == params.merchantAmount + expectedFee, "Invalid fee split");

    // Authorize for payerAmount
    commerceEscrow.authorize(paymentInfo, params.payerAmount, ...);
}
```

**Recommendation**: **Do not implement** unless there's strong user demand. Merchant-pays is standard in payment processing.

---

## Fee Distribution via ERC20FeeProxy

### Why Route Through ERC20FeeProxy?

1. **Request Network event compatibility**: `TransferWithReferenceAndFee` event
2. **Unified tracking**: All RN payments emit same event structure
3. **Payment detection**: RN indexers can detect fee payments
4. **Audit trail**: Clear on-chain record of fee splits

### Commerce Escrow Fee Bypass

```solidity
// In _createPaymentInfo():
IAuthCaptureEscrow.PaymentInfo({
    // ...
    minFeeBps: 0,
    maxFeeBps: 10000,
    feeReceiver: address(0)  // NO Commerce Escrow fee
});

// In capturePayment():
commerceEscrow.capture(paymentInfo, captureAmount, 0, address(0));
//                                                  ^          ^
//                                                feeBps      feeReceiver
//                                          (Commerce Escrow fee bypassed)

// Then distribute via ERC20FeeProxy:
erc20FeeProxy.transferFromWithReferenceAndFee(
    payment.token,
    payment.merchant,
    merchantAmount,     // Merchant gets this
    paymentReference,
    feeAmount,          // Fee recipient gets this
    feeReceiver
);
```

### Hybrid Fee Model (Future Consideration)

If Commerce Escrow protocol fees are needed in the future:

```solidity
// Scenario: Commerce Escrow protocol fee (0.1%) + RN platform fee (2.5%)
// Total: 2.6%

// Option 1: Cascade fees (simplest)
commerceEscrow.capture(paymentInfo, captureAmount, 10, commerceFeeReceiver);
// Wrapper receives: captureAmount * 0.999
erc20FeeProxy.transferFromWithReferenceAndFee(..., 250, rnFeeReceiver);

// Option 2: Combined fee calculation (most transparent)
uint256 commerceFee = (captureAmount * 10) / 10000;     // 0.1%
uint256 rnFee = (captureAmount * 250) / 10000;           // 2.5%
uint256 merchantAmount = captureAmount - commerceFee - rnFee;
```

**Recommendation**: Keep fees separate (Commerce Escrow vs RN Platform) for clarity and independent configuration.

---

## Fee-Free Operations

### Operations with NO Fee:

1. **Void** (`voidPayment`): Remedial action, merchant gets nothing
2. **Reclaim** (`reclaimPayment`): Authorization expiry, payer gets refund
3. **Refund** (`refundPayment`): Post-capture refund, payer gets money back

**Rationale**:

- No value captured by merchant = no fee charged
- Refunds are reversals, not new value creation
- Charging fees on remedial actions creates bad incentives (discourages proper customer service)

```solidity
// In voidPayment(), reclaimPayment(), refundPayment():
emit TransferWithReferenceAndFee(
    payment.token,
    payment.payer,
    amount,
    paymentReference,
    0,              // No fee
    address(0)      // No fee receiver
);
```

---

## Security Considerations

### 1. Fee Validation

```solidity
if (feeBps > 10000) revert InvalidFeeBps();
```

**Prevents**:

- Integer underflow: `captureAmount - feeAmount` would underflow if `feeAmount > captureAmount`
- Accidental 100%+ fees
- Merchant receiving negative amounts

### 2. Fee Calculation Overflow

```solidity
uint256 feeAmount = (captureAmount * feeBps) / 10000;
```

**Safe in Solidity 0.8+**: Automatic overflow protection. If `captureAmount * feeBps` overflows `uint256`, transaction reverts.

**Maximum safe values**:

- `captureAmount = type(uint256).max / 10000` (~1.15e73)
- In practice, token supplies are << 1e30, so no risk

### 3. Zero Fee Receiver

```solidity
address feeReceiver = address(0);
```

**Behavior**: `ERC20FeeProxy` will transfer fee to `address(0)` (effectively burning it).

**Use cases**:

- Promotional periods (no fee charged)
- Grandfathered merchants
- Internal testing

**Caution**: Ensure this is intentional. Lost fees cannot be recovered.

---

## Gas Optimization

### Fee Calculation: Pure Arithmetic

```solidity
uint256 feeAmount = (captureAmount * feeBps) / 10000;  // ~20 gas
uint256 merchantAmount = captureAmount - feeAmount;   // ~20 gas
```

### Single ERC20FeeProxy Call

```solidity
erc20FeeProxy.transferFromWithReferenceAndFee(
    token,
    merchant,
    merchantAmount,
    paymentReference,
    feeAmount,
    feeReceiver
);
```

**Why not separate transfers?**

- `transfer(merchant, merchantAmount)` + `transfer(feeReceiver, feeAmount)` = **2 transfers**
- `ERC20FeeProxy` does it in **1 call** with proper event emission

**Gas savings**: ~5,000 gas per capture (1 transfer operation saved)

---

## Testing Recommendations

### Test Coverage Matrix

| Test Case                              | Fee Scenario         | Expected Behavior                         |
| -------------------------------------- | -------------------- | ----------------------------------------- |
| `capturePayment` with 0% fee           | `feeBps = 0`         | Merchant gets full amount                 |
| `capturePayment` with 2.5% fee         | `feeBps = 250`       | Merchant gets 97.5%                       |
| `capturePayment` with 100% fee         | `feeBps = 10000`     | Fee receiver gets all, merchant $0        |
| `capturePayment` with >100% fee        | `feeBps = 10001`     | **Reverts** `InvalidFeeBps`               |
| `capturePayment` with rounding edge    | `1001 wei @ 250 bps` | Merchant gets 976 (not 975.975)           |
| `capturePayment` with zero feeReceiver | `feeReceiver = 0x0`  | Fee burned to `address(0)`                |
| `voidPayment`                          | N/A                  | No fee charged                            |
| `reclaimPayment`                       | N/A                  | No fee charged                            |
| `refundPayment`                        | N/A                  | No fee charged                            |
| Partial captures with different fees   | Varying `feeBps`     | Each capture calculates fee independently |

### Current Test Coverage

See: `packages/smart-contracts/test/contracts/ERC20CommerceEscrowWrapper.test.ts`

- ✅ Fee calculation (0%, 2.5%, 5%, 50%, 100%)
- ✅ Fee validation (`InvalidFeeBps` for >10000)
- ✅ Token balance verification (merchant + fee = capture amount)
- ✅ Zero fee receiver handling
- ✅ Multiple partial captures with different fees
- ✅ Charge payment with fees
- ✅ Void/reclaim/refund have no fees

---

## Integration Guidelines

### For Platform Operators

```typescript
// Capture with Request Network platform fee
const feeBps = 250; // 2.5%
const feeReceiver = '0x...'; // Your treasury address

await wrapper.capturePayment(paymentReference, captureAmount, feeBps, feeReceiver);

// Merchant receives: captureAmount * (10000 - feeBps) / 10000
// Fee receiver gets: captureAmount * feeBps / 10000
```

### For Multi-Party Fee Splits

```solidity
// Deploy a FeeDistributor contract:
contract RequestNetworkFeeDistributor {
    address public constant RN_TREASURY = 0x...;
    address public immutable PLATFORM_OPERATOR;

    uint16 public constant RN_SHARE_BPS = 150;  // 1.5% to RN
    uint16 public constant PLATFORM_SHARE_BPS = 100; // 1.0% to platform
    // Total fee: 2.5%

    constructor(address platformOperator) {
        PLATFORM_OPERATOR = platformOperator;
    }

    function distributeFees(address token) external {
        uint256 balance = IERC20(token).balanceOf(address(this));

        uint256 rnAmount = (balance * RN_SHARE_BPS) / (RN_SHARE_BPS + PLATFORM_SHARE_BPS);
        uint256 platformAmount = balance - rnAmount;

        IERC20(token).transfer(RN_TREASURY, rnAmount);
        IERC20(token).transfer(PLATFORM_OPERATOR, platformAmount);
    }
}

// Usage:
const feeDistributor = await FeeDistributor.deploy(platformOperator);
await wrapper.capturePayment(ref, amount, 250, feeDistributor.address);
await feeDistributor.distributeFees(tokenAddress);
```

---

## Future Enhancements

### 1. Dynamic Fee Tiers

```solidity
mapping(address => uint16) public merchantFeeTiers;

function capturePayment(...) external {
    uint16 feeBps = merchantFeeTiers[payment.merchant];
    // ... rest of logic
}
```

**Benefits**: Volume discounts, promotional rates, grandfathered merchants

**Challenges**:

- On-chain storage costs
- Fee tier management governance
- Retroactive tier changes for authorized payments

### 2. Fee Oracle for Dynamic Pricing

```solidity
interface IFeeOracle {
    function getFeeBps(address merchant, address token, uint256 amount)
        external view returns (uint16);
}

function capturePayment(..., address feeOracle) external {
    uint16 feeBps = IFeeOracle(feeOracle).getFeeBps(merchant, token, amount);
    // ...
}
```

**Benefits**: Real-time fee adjustments, A/B testing, market-responsive pricing

**Challenges**:

- Oracle security/reliability
- Gas costs for external calls
- Fee predictability for merchants

### 3. Token-Specific Fee Structures

```solidity
mapping(address => uint16) public tokenFeeBps;

// USDC: 250 bps (2.5%)
// DAI: 200 bps (2.0%)
// WETH: 300 bps (3.0%)
```

**Rationale**: Higher fees for volatile assets, lower fees for stablecoins

### 4. Fee Subsidies / Cashback

```solidity
struct FeeConfig {
  uint16 platformFeeBps;
  uint16 merchantSubsidyBps; // Platform reimburses merchant
}

// Example: 2.5% fee, but 1% reimbursed to merchant
// Merchant effectively pays 1.5%

```

**Use cases**: New merchant onboarding, high-value merchants, promotional periods

### 5. Multi-Currency Fee Payment

```solidity
function capturePayment(
    ...,
    address feeToken  // Pay fee in different token (e.g., RN governance token)
) external;
```

**Complexity**: Exchange rate oracles, slippage, additional token transfers

---

## Upgrade Path

### Breaking Changes Requiring New Deployment

1. **Payer-pays-fee model**: Changes authorization flow
2. **Multiple fee recipients**: Changes function signature
3. **Fee token different from payment token**: New architecture

### Non-Breaking Enhancements

1. **Fee splitter contract**: External, no wrapper changes
2. **Dynamic fee tiers**: Storage-only change, function signature unchanged
3. **Fee oracle**: Optional parameter (backward compatible)

### Migration Strategy

```solidity
// Version 2 with multiple fee recipients:
contract ERC20CommerceEscrowWrapperV2 {
  // New signature
  function capturePayment(
    bytes8 paymentReference,
    uint256 captureAmount,
    FeeConfig calldata fees // NEW: structured fees
  ) external;
}

// Adapter for backward compatibility:
function capturePayment(
  bytes8 paymentReference,
  uint256 captureAmount,
  uint16 feeBps,
  address feeReceiver
) external {
  FeeConfig memory fees = FeeConfig({
    platformFeeBps: feeBps,
    platformFeeReceiver: feeReceiver,
    rnFeeBps: 0,
    rnFeeReceiver: address(0)
  });
  _capturePayment(paymentReference, captureAmount, fees);
}

```

---

## Design Decision Summary

| Decision                 | Current Implementation    | Rationale                                        | Future Path                               |
| ------------------------ | ------------------------- | ------------------------------------------------ | ----------------------------------------- |
| **Fee Type**             | RN Platform Fee           | Distinct from Commerce Escrow protocol fees      | Maintain separation                       |
| **Fee Payer**            | Merchant                  | Standard payment processing model, UX simplicity | Consider payer-pays only if demanded      |
| **Fee Recipients**       | Single address            | Gas efficiency, simplicity                       | Use fee splitter contract for multi-party |
| **Fee Distribution**     | Via ERC20FeeProxy         | RN event compatibility, unified tracking         | Keep current approach                     |
| **Commerce Escrow Fees** | Bypassed (0 bps)          | Avoid fee-on-fee, separate concerns              | Maintain unless protocol requires         |
| **Fee-Free Operations**  | Void, reclaim, refund     | No value capture = no fee                        | No change needed                          |
| **Fee Validation**       | <= 10000 bps              | Prevent underflow, accidental 100%+ fees         | Add min fee for micro-transactions?       |
| **Rounding**             | Truncate (favor merchant) | Solidity integer division default                | Consider fixed-point if precision needed  |

---

## Conclusion

The current fee mechanism design prioritizes:

1. **Simplicity**: One fee parameter, merchant-pays model
2. **Compatibility**: Routes through ERC20FeeProxy for RN ecosystem
3. **Flexibility**: Single recipient can be a fee splitter contract
4. **Security**: Fee validation prevents underflow/overflow
5. **Extensibility**: Clear upgrade paths documented

**For most use cases, the current design is sufficient.** Multi-party fee splits can be handled externally via a `FeeDistributor` contract without protocol changes.

**Major architectural changes** (payer-pays-fee, multi-recipient) should be reserved for a future major version (V2) with full migration support.

---

## References

- Contract: `packages/smart-contracts/src/contracts/ERC20CommerceEscrowWrapper.sol`
- Tests: `packages/smart-contracts/test/contracts/ERC20CommerceEscrowWrapper.test.ts`
- ERC20FeeProxy: Request Network's payment proxy for fee distribution
- Commerce Escrow: Coinbase Commerce Payments auth/capture escrow

---

**Document Version**: 1.0  
**Last Updated**: 2025-11-18  
**Authors**: Request Network & Coinbase Commerce Integration Team  
**Status**: Living Document - Update as design evolves
