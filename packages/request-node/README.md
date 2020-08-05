# @requestnetwork/request-node

`@requestnetwork/request-node` is a package part of the [Request Network protocol](https://github.com/RequestNetwork/requestNetwork).
This package allows you to run a full Request Node.

Request Nodes are the basic servers used to allow any user to communicate with the Request Network protocol, these servers abstract the complexity of the storage layer for the users. The users can easily create a request or execute an action on a request by sending messages to the Node.

The Request Node runs the two bottom layers of the Request Network protocol:

- **Data-access layer**: Indexes request transactions and batches them into blocks.
- **Storage layers**: Persists data from Data-access layer.

Therefore, the Node receives request transactions from users, batches them into blocks and persists them into the storage.

Once received by the Node, other request actors connecting to this Node can directly read the request transaction before it is persisted into the storage layer.

To use Infura to connect to an Ethereum node, get an infura token on [infura.io](infura.io) and
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

To setup your IPFS node to the private network, you can run the following utility script:

```bash
yarn init-ipfs
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
- `--providerUrl` URL of the web3 provider for Ethereum
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
- `--headers` Custom headers to send with the API responses (as a stringified JSON object)
  - Default value: `'{}'`
  - Environment variable name: `$HEADERS`
- `--lastBlockNumberDelay` The minimum delay between getLastBlockNumber calls to ethereum network
  - Default value: `'10000'`
  - Environment variable name: `$LAST_BLOCK_NUMBER_DELAY`
- `--storageConcurrency` Maximum number of concurrent calls to Ethereum or IPFS
  - Default value: `'200'`
  - Environment variable name: `$STORAGE_MAX_CONCURRENCY`
- `--initializationStorageFilePath` Path to a file to persist the ethereum metadata and transaction index for faster initialization
  - Environment variable name: `$INITIALIZATION_STORAGE_FILE_PATH`
- `--logLevel` The maximum level of messages we will log
  - Environment variable name: `$LOG_LEVEL`
  - Available levels: ERROR, WARN, INFO and DEBUG
- `--logMode` Defines the log format to use
  - Environment variable name: `$LOG_MODE`
  - Available modes:
    - `human` is a more human readable log to display during development
    - `machine` is better for parsing on CI or deployments
- `--persistTransactionTimeout` Defines the delay in seconds to wait before sending a timeout when creating or updating a request
  - Default value: 600
  - Environment variable name: `$PERSIST_TRANSACTION_TIMEOUT`
- `--externalUrl` External url of the node (used to identified where the buffer data are stored before being broadcasted on ethereum)
  - Environment variable name: `$EXTERNAL_URL`

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
For now, the user has to clone the repository to build the Docker and run it.

```bash
git clone https://github.com/RequestNetwork/requestNetwork.git
cd packages/request-node
docker build -t "request-node" .
docker run request-node
```

The environment variables used to configure the Node can be defined in the `docker run` command.

For example, the user can define custom parameters for IPFS connection with the following command:

```
docker run -e IPFS_HOST=<custom_ipfs_host> IPFS_PORT=<custom_ipfs_port>
```

If the user want the server to listen on a specific port, he has to expose that port as well:

```
docker run -e PORT=80 --expose 80
```

The user can connect to an IPFS node and Ethereum node (like ganache) on the local machine, using the following:

```bash
docker run -e IPFS_HOST=host.docker.internal -e WEB3_PROVIDER_URL=http://host.docker.internal:8545
```

The user can use the docker-compose tool to run an environment containing the Request Node and an instance of IPFS with the following command:

```bash
docker-compose up
```

The environment variables must be defined in the `docker-compose.yml` file in the `environment` section. `$ETHEREUM_NETWORK_ID` and `$WEB3_PROVIDER_URL` must be defined.

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
Note: only IPFS v0.4.* supported, from the [IPFS Installation docs](https://docs.ipfs.io/install/), replace the binary URL with the good one from the following list: https://github.com/ipfs/go-ipfs/releases/tag/v0.4.23

```bash
ipfs daemon
```

#### 4. On a new terminal, configure your IPFS node to connect to the private Request IPFS network

```bash
cd packages/request-node
yarn init-ipfs
```

#### 5. Launch [ganache](https://github.com/trufflesuite/ganache-cli#installation) with the default Request Node mnemonic

```bash
ganache-cli -l 90000000 -p 8545 -m \"candy maple cake sugar pudding cream honey rich smooth crumble sweet treat\"
```

#### 6. Deploy the smart contracts on ganache

```bash
cd packages/smart-contracts
yarn deploy
```

#### 7. Run the Request Node

```bash
cd ../packages/request-node
yarn start
```

#### 8. Test

Open a browser and navigate towards: http://localhost:3000/status
You can see the details of your local Request & IPFS nodes.

## Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.
[Read the contributing guide](/CONTRIBUTING.md)

## License

[MIT](/LICENSE)
