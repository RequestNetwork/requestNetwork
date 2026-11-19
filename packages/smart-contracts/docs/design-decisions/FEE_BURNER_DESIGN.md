# Fee Burner Design - RequestFeeBurner

## Overview

`RequestFeeBurner` is a fee recipient whose only possible outcome for the fees it receives is **burned REQ**.
It is meant to be used as the `_feeAddress` of `ERC20FeeProxy` / `EthereumFeeProxy` payments
(including those created by the Request API), replacing occasional manual burn batches with
continuous, on-chain, verifiable burns tied to protocol volume.

```
payer ──ERC20FeeProxy──▶ payee            (amount)
            └──────────▶ RequestFeeBurner (fee, e.g. USDC)
                               │ keeper: swapAndBurn(path → REQ, minReqOut)
                               ▼
                         REQ.burn()  → totalSupply decreases, ReqBurned event
```

No change to existing payment proxies, payment networks or payment detection is required: the
burner is just an address that receives fees.

## Design Principles

1. **Fees can only become burned REQ.** No withdraw, rescue or sweep function exists. A test
   asserts the full list of state-changing functions so one cannot be added silently.
2. **Immutable configuration.** REQ token, router, wrapped native token and burn mode are set at
   deployment. Changing them means deploying a new burner and repointing the fee address.
3. **Minimal admin power.** The owner can only add or remove keepers. It cannot touch funds,
   change the router or pause burns.
4. **Do not trust external contracts.** REQ received is measured by balance delta, router
   allowances are exact and reset to zero, and every entry point is reentrancy-guarded.

## Design Decisions

### Decision 1: Keeper-gated swaps

- **Options Considered**: (A) permissionless `swapAndBurn` with caller-supplied minimum output,
  (B) permissionless with an on-chain TWAP/oracle bound, (C) keeper-gated with mandatory
  non-zero minimum output.
- **Choice**: C
- **Rationale**: (A) lets anyone call with `minOut = 1` inside a sandwich and extract most of the
  fees. (B) requires a reliable REQ price oracle on every supported chain and the Uniswap V3
  oracle libraries, which do not compile under this package's 0.8.9 toolchain without forks.
- **Trade-offs**: Keepers are trusted to choose a sensible `minReqOut` and to submit through a
  private mempool (e.g. Flashbots Protect). A malicious keeper can at worst burn fees at a bad
  price; it can never send fees anywhere else. The owner can revoke it. Burning REQ that is
  already held (`burnHeldReq`) and wrapping native fees (`wrapNative`) remain permissionless.

### Decision 2: Uniswap V2-compatible router

- **Options Considered**: Uniswap V2 router interface, Uniswap V3 `ISwapRouter`, an aggregator.
- **Choice**: V2 interface (`swapExactTokensForTokens`), consistent with `ERC20SwapToPay`.
- **Rationale**: Available on every chain Request supports (Uniswap, SushiSwap, PancakeSwap,
  Honeyswap...), simple path semantics, easy to verify.
- **Trade-offs**: Must be deployed with a router whose pools have REQ liquidity on that chain.
  A V3 variant can be added later as a separate contract without touching this one.

### Decision 3: `burn()` vs dead address

- **Choice**: Immutable `useBurnFunction` flag.
- **Rationale**: REQ on Ethereum mainnet (`0x8f8221aF…a938a`) exposes `burn(uint256)`, which
  lowers `totalSupply`. Bridged REQ on other chains may not, so the burner can instead send REQ to
  `0x…dEaD`. REQ refuses transfers to `address(0)`, so the dead address is used instead.

### Decision 4: Native fees are wrapped, not swapped directly

- `EthereumFeeProxy` forwards native fees with a 2300 gas stipend, so `receive()` does nothing
  beyond an immutable check. Anyone can call `wrapNative()` to convert the balance to the wrapped
  token, which keepers then swap like any ERC20. Deploying with `wrappedNativeToken = address(0)`
  makes the contract reject native fees so they cannot get stuck.

### Decision 5: Ownership cannot be renounced

- `renounceOwnership` always reverts and ownership transfers are two-step (`Ownable2Step`).
  Renouncing would freeze the keeper set, and if every keeper key were lost, fees would be stuck
  forever because there is intentionally no withdrawal path.

## Security Considerations

| Risk                                    | Mitigation                                                                  |
| --------------------------------------- | --------------------------------------------------------------------------- |
| Owner or keeper steals fees             | No transfer path other than swap → burn; router immutable                   |
| Sandwich / MEV on swap                  | Keeper-only; `minReqOut > 0` enforced; private mempool recommended          |
| Router lies about output                | REQ received measured by balance delta and checked against `minReqOut`      |
| Lingering allowance to router           | Exact `forceApprove` before swap, reset to 0 after                          |
| USDT-style tokens                       | OpenZeppelin `SafeERC20.forceApprove` / `safeTransfer`                      |
| Reentrancy (router, tokens)             | `nonReentrant` on every external entry point (tested for all three)         |
| Path pointing to wrong output           | Path must end in REQ, must not start with REQ, length ≥ 2                   |
| Stale transactions                      | Deadline checked locally and by the router                                  |
| Wrong burn mode at deployment           | Burn failure reverts the whole swap atomically; fees stay in the contract   |
| Native fees on chains without a wrapper | `receive()` reverts when `wrappedNativeToken == 0`                          |
| Fee-on-transfer fee tokens              | Not supported by `swapExactTokensForTokens`; swap reverts, no loss of funds |

Static analysis (Slither) findings were triaged: `reentrancy-balance` on the balance-delta check
is mitigated by `nonReentrant` (extra REQ arriving mid-swap would only increase the burn);
`unused-return` on the router call is intentional (output is measured instead); the
`incorrect-equality`, `timestamp` and `missing-zero-check` (wrapped native) findings are
intended behavior.

## Operations

1. Deploy with `(REQ, router, wrappedNative, useBurnFunction, owner)` per chain.
2. Owner calls `setKeeper(keeper, true)`.
3. Point the Request API / integrations' fee address to the burner.
4. Keeper bot, for each fee token with a balance worth swapping: quote off-chain, call
   `swapAndBurn(path, amountIn, quote × (1 − slippage), deadline)` through a private RPC.
5. Anyone can verify burns via `ReqBurned` events, `totalReqBurned` and REQ `totalSupply`.

## Future Enhancements

- Oracle-bounded permissionless `swapAndBurn` once a reliable REQ price feed is available.
- Uniswap V3 / aggregator variant for deeper liquidity.
- CREATE2 deployment entry in `scripts-create2` and artifact registration once addresses are known.

## References

- Contract: [`src/contracts/RequestFeeBurner.sol`](../../src/contracts/RequestFeeBurner.sol)
- Tests: [`test/contracts/RequestFeeBurner.test.ts`](../../test/contracts/RequestFeeBurner.test.ts)
- Test mocks: [`src/contracts/test/RequestFeeBurnerMocks.sol`](../../src/contracts/test/RequestFeeBurnerMocks.sol)
- Related: [`ERC20FeeProxy`](../../src/contracts/ERC20FeeProxy.sol), [`EthereumFeeProxy`](../../src/contracts/EthereumFeeProxy.sol), [`StorageFeeCollector`](../../src/contracts/StorageFeeCollector.sol)
