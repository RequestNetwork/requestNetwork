# @requestnetwork/smart-contracs

`@requestnetwork/smart-contracts` is a package part of the [Request Network protocol](https://github.com/RequestNetwork/requestNetwork).
The package stores the sources and artifacts of the smart contracts deployed on Ethereum. It also exposes a library to get information about the artifacts.

## Installation

```bash
npm install @requestnetwork/smart-contracts
```

## Usage

Library usage:

```js
import * as SmartContracts from '@requestnetwork/smart-contracts';

const requestHashStorageMainnetAddress = SmartContracts.requestHashStorageArtifact.getAddress(
  'mainnet',
);

const requestHashSubmitterRinkebyAddress = SmartContracts.requestHashSubmitterArtifact.getAddress(
  'rinkeby',
);

const requestHashStorageABI = SmartContracts.requestHashStorageArtifact.getContractAbi();
```

## Smart Contract

The package stores the following smart contracts:

**Smart contracts for ethereum-storage package**

- `RequestHashStorage` allows to declare a hash `NewHash(hash, submitter, feesParameters)`. Only a whitelisted contract can declare hashes.
- `RequestOpenHashSubmitter` entry point to add hashes in `RequestHashStorage`. It gives the rules to get the right to submit hashes and collect the fees. This contract must be whitelisted in `RequestHashStorage`. The only condition for adding hash is to pay the fees.
- `StorageFeeCollector` parent contract (not deployed) of `RequestOpenHashSubmitter`, computes the fees and send them to the burner.

**Smart contracts for advanced-logic package**

- `TestERC20` minimal erc20 token used for tests.
- `ERC20Proxy` smart contract used by the erc20 proxy contract payment network to store payment references of erc20 transfers
- `EthereumProxy` smart contract used by the ethereum proxy contract payment network to store payment references of Ethereum transfers
- `ERC20FeeProxy` smart contract used by the erc20 fee proxy contract payment network to store payment references of erc20 transfers with fees

#### Smart contracts local deployment

The smart contracts can be deployed locally with the following commands:

```bash
git clone https://github.com/RequestNetwork/requestNetwork.git
cd requestNetwork/packages/smart-contracts
yarn install
yarn run build
yarn run ganache
```

And in another terminal:

```bash
yarn run deploy
```

#### Configuring the provider using Truffle and the development network

When deploying the smart contracts for development you can manually set the provider host and port via env variables:

```bash
TRUFFLE_GANACHE_HOST="host" TRUFFLE_GANACHE_PORT=1010 yarn run deploy
```

## Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.
[Read the contributing guide](/CONTRIBUTING.md)

## License

[MIT](/LICENSE)
