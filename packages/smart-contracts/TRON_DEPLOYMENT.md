# Tron Deployment Guide

This document describes how to deploy and test Request Network smart contracts on the Tron blockchain.

## Prerequisites

1. **TronBox** - Install globally:

   ```bash
   npm install -g tronbox
   ```

2. **TRX for Gas** - You need TRX to pay for transaction fees:

   - Nile Testnet: Get free TRX from [Nile Faucet](https://nileex.io/join/getJoinPage)
   - Mainnet: Purchase TRX from an exchange

3. **Private Key** - Export your Tron wallet private key

## Configuration

Set your private key as an environment variable:

```bash
export TRON_PRIVATE_KEY=your_private_key_here
```

## Compilation

Compile contracts for Tron:

```bash
yarn tron:compile
```

This creates artifacts in `build/tron/` directory.

## Testing

### Local Development

Start a local Tron node (optional):

```bash
# TronBox includes a built-in development network
tronbox develop
```

Run tests against local network:

```bash
yarn tron:test
```

### Nile Testnet

Run tests against Nile testnet:

```bash
TRON_PRIVATE_KEY=your_key yarn tron:test:nile
```

## Deployment

### Nile Testnet

Deploy to Nile testnet:

```bash
TRON_PRIVATE_KEY=your_key yarn tron:deploy:nile
```

This will:

1. Deploy ERC20FeeProxy
2. Deploy TestTRC20 tokens
3. Save deployment info to `deployments/tron/nile.json`

### Mainnet

**⚠️ WARNING: Mainnet deployment uses real TRX!**

Deploy to mainnet:

```bash
TRON_PRIVATE_KEY=your_key yarn tron:deploy:mainnet
```

For automated deployments:

```bash
TRON_PRIVATE_KEY=your_key CONFIRM_MAINNET_DEPLOY=true yarn tron:deploy:mainnet
```

## Verification

Verify deployed contracts:

```bash
# Nile testnet
TRON_PRIVATE_KEY=your_key yarn tron:verify:nile

# Mainnet
TRON_PRIVATE_KEY=your_key yarn tron:verify:mainnet
```

## Contract Addresses

### Nile Testnet

- ERC20FeeProxy: `THK5rNmrvCujhmrXa5DB1dASepwXTr9cJs`
- Block: 63208782

### Mainnet

- ERC20FeeProxy: `TCUDPYnS9dH3WvFEaE7wN7vnDa51J4R4fd`
- Block: 79216121

## Tron-Specific Considerations

### Address Format

- Tron uses Base58 addresses (e.g., `THK5rNmrvCujhmrXa5DB1dASepwXTr9cJs`)
- Ethereum-style hex addresses need conversion via TronWeb

### Token Standard

- TRC20 is equivalent to ERC20 on Tron
- Same ABI, same function signatures
- Different address format

### Gas vs Energy

- Tron uses "energy" instead of "gas"
- Energy is typically cheaper than Ethereum gas
- Fee limit is set in SUN (1 TRX = 1,000,000 SUN)

### Known Limitations

- Some Solidity features may behave differently
- `isContract` is a reserved keyword in Tron assembly (not an issue for ERC20FeeProxy)
- TheGraph subgraphs are not supported; use Substreams instead

## Test Suite Coverage

The test suite covers:

1. **Basic Functionality**

   - Transfer with reference and fee
   - Zero fee transfers
   - Event emission

2. **Edge Cases**

   - Insufficient allowance
   - Insufficient balance
   - Invalid token address
   - Non-standard TRC20 tokens

3. **Integration Tests**

   - End-to-end payment flows
   - Multiple sequential payments
   - Different token decimals

4. **Energy Analysis**
   - Energy consumption metrics
   - Comparison with EVM gas costs

## Troubleshooting

### "Artifact not found" Error

Run `yarn tron:compile` first.

### "Insufficient balance" Error

Get TRX from the faucet (testnet) or fund your account (mainnet).

### Transaction Reverted

Check the contract parameters and ensure proper token approval.

### Energy Exceeded

Increase the `feeLimit` in `tronbox-config.js` (default: 1000 TRX).
