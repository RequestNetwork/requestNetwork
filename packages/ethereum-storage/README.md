# @requestnetwork/ethereum-storage

`@requestnetwork/ethereum-storage` is a package part of the [Request Network protocol](https://github.com/RequestNetwork/requestNetwork).
It is an implementation of the Storage layer of Request Network protocol that uses IPFS to immutably store the data and uses the Ethereum network to persist the IPFS hash of the data and make them permanently available to everyone.

The package also stores the source and artifacts of the smart contract deployed on Ethereum.

To use Infura to connect to an Ethereum node, get an infura token on [infura.io](infura.io) and
use as provider `"NETWORK_YOU_WANT.infura.io/v3/YOUR_INFURA_TOKEN"`.

## Installation

```bash
npm install @requestnetwork/ethereum-storage
```

## Usage

```js
import EthereumStorage from '@requestnetwork/ethereum-storage';
import { Storage as StorageTypes } from '@requestnetwork/types';

const web3HttpProvider = require('web3-providers-http');

const provider = new web3HttpProvider('http://localhost:8545');

const web3Connection: StorageTypes.IWeb3Connection = {
  networkId: StorageTypes.EthereumNetwork.PRIVATE,
  timeout: 1000,
  web3Provider: provider,
};

const ipfsGatewayConnection: StorageTypes.IIpfsGatewayConnection = {
  host: 'localhost',
  port: 5001,
  protocol: StorageTypes.IpfsGatewayProtocol.HTTP,
  timeout: 1000,
};

const ethereumStorage = new EthereumStorage(ipfsGatewayConnection, web3Connection);

const data = 'Some data';

await ethereumStorage.append(data);
```

## Smart Contract

ethereum-storage source can be downloaded in order to deploy the smart contract on a local environment:

```bash
git clone https://github.com/RequestNetwork/requestNetwork.git
cd requestNetwork/packages/ethereum-storage
yarn install
yarn run build
yarn run ganache
```

And in another terminal:

```bash
yarn run deploy
```

## IPFS

In order to use the package in a test environment, IPFS can be installed locally and started with the following commands:

```bash
npm install ipfs --global
ipfs init
ipfs daemon
```

Local IPFS listening on port 5001 is used by default by the `ethereum-storage` package.

## Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.
[Read the contributing guide](/CONTRIBUTING.md)

## License

[MIT](/LICENSE)
