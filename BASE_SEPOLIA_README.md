# Base Sepolia Support for Request Network

This directory contains all the changes needed to deploy and use ERC20FeeProxy and ERC20CommerceEscrowWrapper contracts on Base Sepolia testnet.

## Quick Start

### 1. Set up your environment

```bash
# Set your private key (without 0x prefix)
export DEPLOYMENT_PRIVATE_KEY=your_private_key_here

# Get Base Sepolia ETH from faucet
# https://www.coinbase.com/faucets/base-ethereum-sepolia-faucet
```

### 2. Deploy contracts

```bash
cd packages/smart-contracts

# Build contracts
yarn build:sol

# Deploy using helper script
./scripts/deploy-base-sepolia.sh

# OR deploy directly
yarn hardhat deploy-erc20-commerce-escrow-wrapper --network base-sepolia
```

### 3. Update deployed addresses

After deployment, update the contract addresses in:

- `packages/smart-contracts/src/lib/artifacts/ERC20FeeProxy/index.ts`
- `packages/smart-contracts/src/lib/artifacts/ERC20CommerceEscrowWrapper/index.ts`

### 4. Rebuild packages

```bash
cd packages/smart-contracts
yarn build
```

## Network Details

| Property     | Value                         |
| ------------ | ----------------------------- |
| Network Name | Base Sepolia                  |
| Chain ID     | 84532                         |
| RPC URL      | https://sepolia.base.org      |
| Explorer     | https://sepolia.basescan.org/ |
| Type         | Testnet                       |

## Deployed Contracts

### Official Coinbase Contracts

- **AuthCaptureEscrow**: `0xBdEA0D1bcC5966192B070Fdf62aB4EF5b4420cff`

### Request Network Contracts (to be deployed)

- **ERC20FeeProxy**: Pending deployment
- **ERC20CommerceEscrowWrapper**: Pending deployment

## Supported Tokens

| Token | Address                                      | Decimals |
| ----- | -------------------------------------------- | -------- |
| USDC  | `0x036CbD53842c5426634e7929541eC2318f3dCF7e` | 6        |

## SDK Usage Example

```typescript
import { RequestNetwork, Types } from '@requestnetwork/request-client.js';

const requestNetwork = new RequestNetwork({
  nodeConnectionConfig: {
    baseURL: 'https://sepolia.gateway.request.network/',
  },
});

// Create a request on Base Sepolia
const request = await requestNetwork.createRequest({
  requestInfo: {
    currency: {
      type: Types.RequestLogic.CURRENCY.ERC20,
      value: '0x036CbD53842c5426634e7929541eC2318f3dCF7e', // USDC
      network: 'base-sepolia',
    },
    expectedAmount: '1000000', // 1 USDC
    payee: {
      type: Types.Identity.TYPE.ETHEREUM_ADDRESS,
      value: '0xPayeeAddress',
    },
  },
  paymentNetwork: {
    id: Types.Extension.PAYMENT_NETWORK_ID.ERC20_FEE_PROXY_CONTRACT,
    parameters: {
      paymentNetworkName: 'base-sepolia',
      paymentAddress: '0xPayeeAddress',
    },
  },
  signer: yourSigner,
});
```

## Files Changed

### Type System

- ✅ `packages/types/src/currency-types.ts` - Added `'base-sepolia'` to EvmChainName

### Currency Package

- ✅ `packages/currency/src/chains/evm/data/base-sepolia.ts` - New chain definition
- ✅ `packages/currency/src/erc20/chains/base-sepolia.ts` - New token list
- ✅ `packages/currency/src/chains/evm/index.ts` - Export chain
- ✅ `packages/currency/src/erc20/chains/index.ts` - Export tokens

### Smart Contracts

- ✅ `packages/smart-contracts/src/lib/artifacts/ERC20FeeProxy/index.ts` - Added deployment config
- ✅ `packages/smart-contracts/src/lib/artifacts/AuthCaptureEscrow/index.ts` - Added official address
- ✅ `packages/smart-contracts/src/lib/artifacts/ERC20CommerceEscrowWrapper/index.ts` - Added deployment config
- ✅ `packages/smart-contracts/hardhat.config.ts` - Already configured ✓

### Payment Detection

- ✅ `packages/payment-detection/src/eth/multichainExplorerApiProvider.ts` - Added network

## Documentation Files

- 📖 **BASE_SEPOLIA_DEPLOYMENT_GUIDE.md** - Complete deployment guide
- 📖 **BASE_SEPOLIA_CHANGES_SUMMARY.md** - Detailed list of all changes
- 📖 **BASE_SEPOLIA_README.md** - This file (quick reference)

## Helper Scripts

- 🛠️ **packages/smart-contracts/scripts/deploy-base-sepolia.sh** - Interactive deployment script
- 🛠️ **packages/smart-contracts/scripts/deploy-erc20-commerce-escrow-wrapper.ts** - Core deployment logic
- 🛠️ **packages/smart-contracts/scripts/test-base-sepolia-deployment.ts** - Test connection script

## Testing Checklist

- [ ] Fund deployment wallet with Base Sepolia ETH
- [ ] Deploy ERC20FeeProxy to Base Sepolia
- [ ] Deploy ERC20CommerceEscrowWrapper to Base Sepolia
- [ ] Update artifact files with deployed addresses
- [ ] Rebuild all packages
- [ ] Create a test request using Base Sepolia USDC
- [ ] Pay the test request
- [ ] Verify payment is detected correctly
- [ ] Test commerce escrow flow

## Troubleshooting

### Insufficient funds

Get Base Sepolia ETH from: https://www.coinbase.com/faucets/base-ethereum-sepolia-faucet

### RPC connection issues

Try alternative RPC: `https://base-sepolia-rpc.publicnode.com`

### Contract verification failed

Manually verify on Basescan:

```bash
yarn hardhat verify --network base-sepolia <CONTRACT_ADDRESS> <CONSTRUCTOR_ARGS>
```

### Linting errors

Run linter:

```bash
yarn lint
```

## Resources

- [Base Documentation](https://docs.base.org/)
- [Request Network Documentation](https://docs.request.network/)
- [Coinbase Commerce Payments](https://github.com/base/commerce-payments)
- [Base Sepolia Faucet](https://www.coinbase.com/faucets/base-ethereum-sepolia-faucet)
- [Base Sepolia Explorer](https://sepolia.basescan.org/)

## Support

- Request Network Discord: https://discord.gg/requestnetwork
- GitHub Issues: https://github.com/RequestNetwork/requestNetwork/issues

## License

MIT
