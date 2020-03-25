---
title: Running from the code repository
keywords: [Request node, test, ganache, local node]
description: Learn how to integrate Request network and its features.
---

If you can't use Docker or you want to run your node locally, from the source code, you can follow the steps in this document.
Running the Node in this way is useful for debugging and developing the Node itself.

# Running locally

To run a Request Node locally for tests, make sure you have the necessary IPFS and Ethereum nodes available.

You can run the following steps to launch a fully local test Request Node.

## Cloning the repository

Let's clone the repository, install and build dependencies:

```bash
git clone https://github.com/RequestNetwork/requestNetwork.git
cd requestNetwork
yarn install
yarn build
```

You are ready to run the local test Node. You will need three different consoles for Ethereum, IPFS, and Request.

## Launching IPFS locally

First, make sure you [installed IPFS](https://docs.ipfs.io/guides/guides/install/) locally.

Now you need to configure your IPFS to connect to our [dedicated network](../7-protocol/6-request-ipfs-network.md). We have a script to make it easy for you:

```bash
cd packages/request-node
yarn init-ipfs
```

Now you can run IPFS with:

```bash
ipfs daemon
```

## Running an Ethereum node

If you want to test using Ethereum mainnet and rinkeby, you can launch your Ethereum node or connect to a service like infura.

If you want to debug and test, you may be interested in using a local Ethereum network.

### Local network using docker

The easiest way to run a local Ethereum network is by using our pre-configured ganache Docker image.
If you have Docker you can just run:

```
docker run --name ganache -d -p 8545:8545 requestnetwork/ganache
```

### Local network using ganache-cli

You can also run ganache-cli to set up a local network.

Install and run [ganache-cli](https://github.com/trufflesuite/ganache-cli) using:

```bash
yarn global add ganache-cli
cd packages/smart-contracts
yarn ganache
```

Now you have ganache-cli running on your second console.
We're still missing all the important smart-contracts that Request uses. On a new console, run:

```bash
cd packages/smart-contracts
yarn deploy
```

Done! Your local Ethereum network is ready for testing.

## Running the Request Node

Now it's time to run the Node:

```bash
cd packages/request-node
yarn start
```

Your Request Node should be running! If you want to run it using a different Ethereum network, mnemonic, or a different IPFS server, you can check out the available options for the node [here](https://github.com/RequestNetwork/requestNetwork/tree/master/packages/request-node#options).

### NPX

If for some reason you want to run the Node without Docker, but don't need to make changes to the repository, you can also use npx to run it directly from npm:

```bash
npx @requestnetwork/request-node [OPTIONS]
```

If you got to this point you know what Node [options](https://github.com/RequestNetwork/requestNetwork/tree/master/packages/request-node#options) you should be using 🙂.
