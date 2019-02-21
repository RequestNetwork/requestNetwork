# `@requestnetwork/request-node`

`@requestnetwork/request-node` is a package part of the [Request Network protocol](https://github.com/RequestNetwork/requestNetwork).
This package allows you to run a full Request Node.

Request Nodes are the basic servers used to allow any user to communicate with the Request Network protocol, these servers abstract the complexity of the storage layer for the users. The users can easily create a request or execute an action on a request by sending messages to the Node.

The Request Node runs the two bottom layers of the Request Network protocol:

- **Data-access layer**: Indexes request transactions and batches them into blocks.
- **Storage layers**: Persists data from Data-access layer.

Therefore, the Node receives request transactions from users, batches them into blocks and persists them into the storage.

Once received by the Node, other request actors connecting to this Node can directly read the request transaction before it is persisted into the storage layer.

## Usage

The users can interact with a Request Node either by using the official [Client-side Library](https://github.com/RequestNetwork/requestNetwork/tree/master/packages/request-client.js) or by sending manual HTTP requests to the API exposed by the server.

### API

The API has the following endpoints:

#### persistTransaction

Persists a request transaction and make it available for the other actors of the request.

```
POST /persistTransaction {BODY}
```

##### Body

| Field           | Type           | Description                                                                                                                                             |
| --------------- | -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| transactionData | {data: string} | Data of the request transaction from the [transaction layer](https://github.com/RequestNetwork/requestNetwork/tree/master/packages/transaction-manager) |
| topics          | string[]       | Topics to attach to the transaction to allows its retrieval                                                                                             |

##### Example

```
curl \
	-d '{"topics":["topicExample"], "transactionData":{"data": "someData"}}' \
	-H "Content-Type: application/json" \
	-X POST http://localhost:3000/persistTransaction
```

##### Success 200

| Field  | Type   | Description              |
| ------ | ------ | ------------------------ |
| meta   | Object | Metadata of the response |
| result | {}     | Empty object             |

##### Error

| Code | Description                                            |
| ---- | ------------------------------------------------------ |
| 422  | The input fields of the request are incorrect          |
| 500  | The persistTransaction operation from DataAccess fails |

#### getTransactionsByTopic

Get request transactions corresponding to a specified topic.

```
GET /getTransactionsByTopic?{PARAMETER}
```

##### Parameter

| Field | Type   | Description                           |
| ----- | ------ | ------------------------------------- |
| topic | string | Topic used to search for transactions |

##### Example

```
curl -i "http://localhost:3000/getTransactionsByTopic?topic=topicExample"
```

##### Success 200

| Field  | Type                     | Description              |
| ------ | ------------------------ | ------------------------ |
| meta   | Object                   | Metadata of the response |
| result | {transactions: string[]} | List of transaction      |

##### Error

| Code | Description                                                |
| ---- | ---------------------------------------------------------- |
| 422  | The input fields of the request are incorrect              |
| 500  | The getTransactionsByTopic operation from DataAccess fails |

## Deployment

A Node can be deployed by anyone. Users interested by running their own node can do it with the following instructions:

### Installation

#### Through the npm executable

```bash
npm install -g @requestnetwork/request-node
```

This will allow you to run the node with

```bash
request-node start
```

#### Through the sources

The Request Node source must be downloaded from Github and executed with Node.js.

```bash
git clone https://github.com/RequestNetwork/requestNetwork/tree/master/packages/request-node/request-node.git
cd request-node
npm install
npm run build
```

### Launch

#### Command line

A Request Node can be started locally with the following command:

```bash
npm run start <options>
```

or

```bash
request-node start <options>
```

All command line options are optional.

The options used to run the server are defined as follows:

1. The option is defined in the command line
2. If the option is not defined in the command line, it is defined by the value of its corresponding environment variable
3. If the environment variable is not defined, default value is used

Default values correspond to the basic configuration used to run a server in a test environment.

#### Options:

- `--port` Port for the server to listen for API requests
  - Default value: `3000`
  - Environment variable name: `$PORT`
- `--networkId` Id of the Ethereum network used
  - Default value: `0`
  - Environment variable name: `$ETHEREUM_NETWORK_ID`
- `--providerHost` URL of the web3 provider for Ethereum
  - Default value: `http://localhost:8545`
  - Environment variable name: `$WEB3_PROVIDER_URL`
- `--ipfsHost` Host of the IPFS gateway
  - Default value: `localhost`
  - Environment variable name: `$IPFS_HOST`
- `--ipfsPort` Port of the IPFS gateway
  - Default value: `5001`
  - Environment variable name: `$IPFS_PORT`
- `--ipfsProtocol` Protocol used to connect to the IPFS gateway
  - Default value: `http`
  - Environment variable name: `$IPFS_PROTOCOL`
- `--ipfsTimeout` Timeout threshold to connect to the IPFS gateway
  - Default value: `10000`
  - Environment variable name: `$IPFS_TIMEOUT`

#### Mnemonic

The wallet used to append data into Ethereum blockchain is generated with a mnemonic.

The environment variable `$MNEMONIC` need to be set to the corresponding mnemonic.

If the environment variable is not set, the default mnemonic is:

```
candy maple cake sugar pudding cream honey rich smooth crumble sweet treat
```

This mnemonic should only be used for testing.

## Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.
[Read the contributing guide](https://github.com/RequestNetwork/requestNetwork/blob/master/CONTRIBUTING.md)

## License

[MIT](https://github.com/RequestNetwork/requestNetwork/blob/develop-v2/LICENSE)
