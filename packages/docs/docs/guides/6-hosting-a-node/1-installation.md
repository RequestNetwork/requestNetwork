---
title: Installation of a node
keywords: [Request node, setup, installation, npm install]

---

We guide you through the setup of a Request node. [TODO-Request-Slack-hub](https://TODO)

# Prerequisites

## IPFS private network
TODO: optional step disclaimer

The Request Node uses IPFS to store and share transactions in a private network. We use a private network to allow all nodes to connect to each other directly, instead of having to navigate through the public IPFS network.

To setup your IPFS node to the private network, you can run the following utility script:

```shell
yarn init-ipfs
```

# Install the package

## Through the npm executable

```shell
npm install -g @requestnetwork/request-node
```

## Through the sources
```shell
git clone https://github.com/RequestNetwork/requestNetwork.git
cd packages/request-node
npm install
npm run build
```

# Launch

## From the command line
Run the Request node with the following command:
```shell
request-node start <options>
#OR npm run start <options>
```
TODO: explain options now or later

## With Docker
```shell
git clone https://github.com/RequestNetwork/requestNetwork.git
cd packages/request-node
docker build -t "request-node" .
docker run request-node
```

You can change the default options in environment variables, with the docker run command.

For example, you can define custom parameters for IPFS connection with the following command:
```shell
docker run -e IPFS_HOST=<custom_ipfs_host> IPFS_PORT=<custom_ipfs_port>
```
Or you can have your server to listen on a specific port:
```shell
docker run -e PORT=80 --expose 80
```

For development and testing, you may have to use local IPFS and Ethereum nodes (like ganache):
```shell
docker run -e IPFS_HOST=host.docker.internal -e WEB3_PROVIDER_URL=http://host.docker.internal:8545
```

