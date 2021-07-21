# @requestnetwork/smart-contracs

`@requestnetwork/smart-contracts` is a package part of the [Request Network protocol](https://github.com/RequestNetwork/requestNetwork).
The package stores the sources and artifacts of the smart contracts deployed on Ethereum. It also exposes a library to get information about the artifacts.

## Installation

```bash
npm install @requestnetwork/smart-contracts
```

You may need some environment variables.
You can create a .env file at the root of this package:

```
DEPLOYMENT_PRIVATE_KEY=...  # Mandatory to deploy on live blockchains
WEB3_PROVIDER_URL=...       # Mandatory to interact with live blockchains
ETHERSCAN_API_KEY=...       # Only used to verify smart contracts code on live blockchains
```

## Usage

Library usage:

```js
import * as SmartContracts from '@requestnetwork/smart-contracts';
import { erc20FeeProxyArtifact } from '@requestnetwork/smart-contracts';

const requestHashStorageMainnetAddress = SmartContracts.requestHashStorageArtifact.getAddress(
  'mainnet',
);

const requestHashSubmitterRinkebyAddress = SmartContracts.requestHashSubmitterArtifact.getAddress(
  'rinkeby',
);

const requestHashStorageABI = SmartContracts.requestHashStorageArtifact.getContractAbi();

const erc20FeeProxyInstance = erc20FeeProxyArtifact.connect(
  // network.name
  'private',
  // RPC Provider or Signer
  new providers.JsonRpcProvider(),
);
```

## Smart Contracts

The package stores the following smart contracts:

**Smart contracts for ethereum-storage package**

- `RequestHashStorage` allows to declare a hash `NewHash(hash, submitter, feesParameters)`. Only a whitelisted contract can declare hashes.
- `RequestOpenHashSubmitter` entry point to add hashes in `RequestHashStorage`. It gives the rules to get the right to submit hashes and collect the fees. This contract must be whitelisted in `RequestHashStorage`. The only condition for adding hash is to pay the fees.
- `StorageFeeCollector` parent contract (not deployed) of `RequestOpenHashSubmitter`, computes the fees and send them to the burner.

**Smart contracts for advanced-logic package**

- `TestERC20` minimal erc20 token used for tests.
- `ERC20Proxy` used to pay requests with an ERC20 proxy contract payment network
- `EthereumProxy` used to pay requests in blockchain native tokens such as ETH on mainnet
- `ERC20FeeProxy` used to pay requests in ERC20 with a fee for the builder [cf. the payment network ERC20 with fee]('../advanced-logic/specs/payment-network-erc20-fee-proxy-contract-0.1.0.md')
- `ERC20ConversionProxy` used to process a payment in ERC20 for an amount fixed in fiat, relying on `ERC20FeeProxy`, [cf. the payment network any-to-erc20](../advanced-logic/specs/payment-network-erc20-fee-proxy-contract-0.1.0.md)

**Smart contracts for payments with swaps**

- `ERC20SwapToPay` same as `ERC20FeeProxy` but allowing the payer to swap another token before paying
- `ERC20SwapToConversion` same as `ERC20ConversionProxy` but allowing the payer to swap another token before paying

## Smart contracts local deployment

The smart contracts can be deployed locally with the following commands:

```bash
git clone https://github.com/RequestNetwork/requestNetwork.git
cd requestNetwork/packages/smart-contracts
# Install packages
yarn install
# Compile smart contracts, generate types and build the library
yarn build
# Run an instance of Ganache, ready for testing
yarn ganache
```

And in another terminal, deploy the smart contracts locally with:

```bash
yarn run deploy
```

### Tests

After a local deployment:

```bash
yarn test
```

## Configuration

Networks and providers are configured in [hardhat.config.ts](hardhat.config.ts).

Have a look at the [Hardhat documentation](https://hardhat.org/config/).

## Contract verification with Hardhat

Verify and publish the contract code automatically to blockchain explorers, right after smart contracts compilation. You should first set the `ETHERSCAN_API_KEY` environment variable.

```bash
yarn hardhat verify --network NETWORK_NAME DEPLOYED_CONTRACT_ADDRESS "Constructor argument 1"
```

## Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.
[Read the contributing guide](/CONTRIBUTING.md)

## License

[MIT](/LICENSE)
