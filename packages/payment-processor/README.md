# @requestnetwork/payment-processor

`@requestnetwork/payment-processor` is a typescript library part of the [Request Network protocol](https://github.com/RequestNetwork/requestNetwork).
It contains client-side payment methods for:

- ERC20 proxy contract
- ETH input data

### Test
To run the payment-processor tests we need a local running ganache with all our smart contracts deployed. You can open two terminals and do:
```
# Terminal 1
cd ../smart-contracts/
yarn ganache

# Terminal 2
cd ../smart-contracts/
yarn deploy
cd ../payment-processor
yarn test
```

### Basic Usage

see [ERC20](/packages/usage-examples/src/pay-erc20-request.ts) and [ETH](/packages/usage-examples/src/pay-eth-request.ts) usage examples.
