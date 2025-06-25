# @requestnetwork/request-node

`@requestnetwork/request-node` is a package part of the [Request Network protocol](https://github.com/RequestNetwork/requestNetwork).
This package allows you to run a full Request Node.

Request Nodes are the basic servers used to allow any user to communicate with the Request Network protocol, these servers abstract the complexity of the storage layer for the users. The users can easily create a request or execute an action on a request by sending messages to the Node.

The Request Node runs the two bottom layers of the Request Network protocol:

- **Data-access layer**: Indexes request transactions and batches them into blocks.
- **Storage layers**: Persists data from Data-access layer.

Therefore, the Node receives request transactions from users, batches them into blocks and persists them into the storage.

Once received by the Node, other request actors connecting to this Node can directly read the request transaction before it is persisted into the storage layer.

To use Infura to connect to an Ethereum node, get an Infura token on [infura.io](infura.io) and
use as provider `"NETWORK_YOU_WANT.infura.io/v3/YOUR_INFURA_TOKEN"`.

## Usage

The users can interact with a Request Node either by using the official [Client-side Library](/packages/request-client.js) or by sending manual HTTP requests to the API exposed by the server.

### API

The API has the following endpoints:

#### persistTransaction

Persists a request transaction and make it available for the other actors of the request.

```
POST /persistTransaction {BODY}
```

##### Body

| Field           | Type           | Description                                                                                 | Requirement   |
| --------------- | -------------- | ------------------------------------------------------------------------------------------- | ------------- |
| transactionData | {data: string} | Data of the request transaction from the [transaction layer](/packages/transaction-manager) | **Mandatory** |
| channelId       | string         | Channel used to group the transactions, a channel is used to represent a request            | **Mandatory** |
| topics          | string[]       | Topics to attach to the channel to allows the retrieval of the channel's transactions       | Optional      |

##### Example

```
curl \
	-d '{"channelId": "channelExample", "topics":["topicExample"], "transactionData":{"data": "someData"}}' \
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

#### getTransactionsByChannelId

Get list of transactions corresponding to a specified channel id.

```
GET /getTransactionsByChannelId?{PARAMETER}
```

##### Parameter

| Field               | Type                       | Description                                                            | Requirement   |
| ------------------- | -------------------------- | ---------------------------------------------------------------------- | ------------- |
| channelId           | string                     | Channel used to search for transactions                                | **Mandatory** |
| timestampBoundaries | {from: number, to: number} | Timestamps to search for transations in a specific temporal boundaries | Optional      |

##### Example

```
curl -i "http://localhost:3000/getTransactionsByChannelId?channelId=channelExample"
```

##### Success 200

| Field  | Type                     | Description              |
| ------ | ------------------------ | ------------------------ |
| meta   | Object                   | Metadata of the response |
| result | {transactions: string[]} | List of transaction      |

##### Error

| Code | Description                                                    |
| ---- | -------------------------------------------------------------- |
| 422  | The input fields of the request are incorrect                  |
| 500  | The getTransactionsByChannelId operation from DataAccess fails |

##### Note

Since the Node doesn't implement a cache yet, all transactions have to be retrieved directly on IPFS.
As a consequence, this request can take a long time if the topic requested indexes many transactions.
This delay will be optimized with the implementation of a cache.

If you experience issues, look into the [Graph mode](#thegraph-mode).

#### getChannelsByTopic

Get transactions from channels indexed by a specified topic.

```
GET /getChannelsByTopic?{PARAMETER}
```

##### Parameter

| Field          | Type                       | Description                                                  | Requirement   |
| -------------- | -------------------------- | ------------------------------------------------------------ | ------------- |
| topic          | string                     | Topic used to search for channels                            | **Mandatory** |
| updatedBetween | {from: number, to: number} | Temporal boundaries when the channel has been lately updated | Optional      |

##### Example

```
curl -i "http://localhost:3000/getChannelsByTopic?topic=topicExample"
```

##### Success 200

| Field  | Type                                    | Description                                |
| ------ | --------------------------------------- | ------------------------------------------ |
| meta   | Object                                  | Metadata of the response                   |
| result | {transactions: {[channelId]: string[]}} | List of transaction indexed by channel ids |

##### Error

| Code | Description                                            |
| ---- | ------------------------------------------------------ |
| 422  | The input fields of the request are incorrect          |
| 500  | The getChannelsByTopic operation from DataAccess fails |

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
git clone https://github.com/RequestNetwork/requestNetwork.git
cd packages/request-node
npm install
npm run build
```

### Setup

#### IPFS private network

The Request Node uses IPFS to store and share transactions in a private network.
We use a private network to allow all nodes to connect to each other directly,
instead of having to navigate through the public IPFS network.

To setup your IPFS node to the private network, you can use the [request-ipfs](https://hub.docker.com/r/requestnetwork/request-ipfs) docker image. Make sure that [docker is installed](https://docs.docker.com/get-docker/) on your system and then run the following command:

```bash
docker run -p 4001:4001 -p 5001:5001 requestnetwork/request-ipfs
```

This will pull the [request-ipfs](https://hub.docker.com/r/requestnetwork/request-ipfs) docker image and run it locally.

#### TheGraph mode

An alternative data access relies on a [Graph](https://thegraph.com/) node, for better indexing & performance.

To enable it, set the `GRAPH_NODE_URL` environment variable to a Graph node with the [Request Storage Subgraph](https://github.com/RequestNetwork/storage-subgraph) deployed and synced.

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

| Option                           | Environment Variable              | Description                                                                                       | Required                             | Default Value                       |
| -------------------------------- | --------------------------------- | ------------------------------------------------------------------------------------------------- | ------------------------------------ | ----------------------------------- |
| `--port`                         | `PORT`                            | Port for the server to listen for API requests                                                    | No                                   | `3000`                              |
| `--networkId`                    | `ETHEREUM_NETWORK_ID`             | Id of the Ethereum network used                                                                   | No                                   | `0`                                 |
| `--providerUrl`                  | `WEB3_PROVIDER_URL`               | URL of the web3 provider for Ethereum                                                             | No                                   | `http://localhost:8545`             |
| `--ipfsUrl`                      | `IPFS_URL`                        | URL of the IPFS gateway                                                                           | No                                   | `http://localhost:5001`             |
| `--ipfsTimeout`                  | `IPFS_TIMEOUT`                    | Timeout threshold to connect to the IPFS gateway                                                  | No                                   | `10000`                             |
| `--blockConfirmations`           | `BLOCK_CONFIRMATIONS`             | The number of block confirmations to consider a transaction successful                            | No                                   | `2`                                 |
| `--storageConcurrency`           | `STORAGE_MAX_CONCURRENCY`         | Maximum number of concurrent calls to Ethereum or IPFS                                            | No                                   | `200`                               |
| `--logLevel`                     | `LOG_LEVEL`                       | The maximum level of messages we will log (ERROR, WARN, INFO or DEBUG)                            | No                                   | `INFO`                              |
| `--logMode`                      | `LOG_MODE`                        | The log format to use (human or machine)                                                          | No                                   | `human`                             |
| `--persistTransactionTimeout`    | `PERSIST_TRANSACTION_TIMEOUT`     | Defines the delay in seconds to wait before sending a timeout when creating or updating a request | No                                   | `600`                               |
| `--externalUrl`                  | `EXTERNAL_URL`                    | External url of the node (used to identify where the buffer data are stored)                      | No                                   | -                                   |
| `--graphNodeUrl`                 | `GRAPH_NODE_URL`                  | External url of the Graph node. See [TheGraph mode](#thegraph-mode)                               | No                                   | -                                   |
| `--thirdwebEngineUrl`            | `THIRDWEB_ENGINE_URL`             | URL of your Thirdweb Engine instance                                                              | **Yes**                              | -                                   |
| `--thirdwebAccessToken`          | `THIRDWEB_ACCESS_TOKEN`           | Access token for Thirdweb Engine                                                                  | **Yes**                              | -                                   |
| `--thirdwebBackendWalletAddress` | `THIRDWEB_BACKEND_WALLET_ADDRESS` | Address of the wallet configured in Thirdweb Engine                                               | **Yes**                              | -                                   |
| `--thirdwebWebhookSecret`        | `THIRDWEB_WEBHOOK_SECRET`         | Secret for verifying webhook signatures                                                           | No                                   | -                                   |
| -                                | `MNEMONIC`                        | The mnemonic for generating the wallet private key                                                | **Yes** (except on private networks) | `candy maple...` (only for testing) |

#### Mnemonic

The wallet used to append data into Ethereum blockchain is generated with a mnemonic.

The environment variable `$MNEMONIC` need to be set to the corresponding mnemonic.

If the environment variable is not set, the default mnemonic is:

```
candy maple cake sugar pudding cream honey rich smooth crumble sweet treat
```

This mnemonic should only be used for testing.

### Docker

The Request Node can be deployed with Docker.
The Docker image is available on the [DockerHub](https://hub.docker.com/r/requestnetwork/request-node).
Please refer to the [RequestNetwork/docker-images](https://github.com/RequestNetwork/docker-images) repository
for instructions on how to use this image.

#### Docker for unpublished version

See instructions in [Dockerfile.dev](./Dockerfile.dev).

### Running fully locally

To run a Request Node locally for tests, make sure you have the necessary IPFS and Ethereum nodes available.

You can run the following steps to launch a fully local test Request Node:

#### 1. Clone the repository

```bash
git clone https://github.com/RequestNetwork/requestNetwork.git
cd requestNetwork
```

#### 2. Install and build all the dependencies.

```bash
yarn install
yarn build
```

#### 3. On a new terminal, launch a local IPFS node

Make sure the [Docker](https://docs.docker.com/get-docker/) is installed.

```bash
docker run -p 4001:4001 -p 5001:5001 requestnetwork/request-ipfs
```

#### 4. Launch [ganache](https://github.com/trufflesuite/ganache-cli#installation) with the default Request Node mnemonic

```bash
ganache-cli -l 90000000 -p 8545 -m \"candy maple cake sugar pudding cream honey rich smooth crumble sweet treat\"
```

#### 5. Deploy the smart contracts on ganache

```bash
cd packages/smart-contracts
yarn deploy
```

#### 6. Run the Request Node

```bash
cd ../packages/request-node
yarn start
```

#### 7. Test

Open a browser and navigate towards: http://localhost:3000/status
You can see the details of your local Request & IPFS nodes.

## Thirdweb Engine Integration

The Request Node uses Thirdweb Engine for transaction submission, which offers several advantages:

- No need to manage private keys in the Request Node
- Better transaction management and monitoring
- Automated gas price optimization and retry mechanisms
- Webhook notifications for transaction status

### Setting Up Thirdweb Engine

1. Deploy Thirdweb Engine by following the [official documentation](https://portal.thirdweb.com/engine/getting-started)
2. Create a wallet in Thirdweb Engine for the Request Node
3. Ensure the wallet has sufficient funds for gas costs
4. Generate an access token with appropriate permissions
5. Configure the Request Node with the required environment variables (see Options table above)

**Note:** The Request Node no longer supports transaction submission through local wallets. All transactions are processed through Thirdweb Engine.

## Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.
[Read the contributing guide](/CONTRIBUTING.md)

## License

[MIT](/LICENSE)
