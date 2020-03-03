---
title: Running fully locally
keywords: [Request node, test, ganache, local node]

---

## TODO Running fully locally
To run a Request Node locally for tests, make sure you have the necessary IPFS and Ethereum nodes available.

You can run the following steps to launch a fully local test Request Node:

First, let's clone the repository, install and build dependencies:
```shell
git clone https://github.com/RequestNetwork/requestNetwork.git
cd requestNetwork
yarn install
yarn build
```

You are ready to run the local test node. You will need three different consoles for Ethereum, IPFS and Request.

Run `ipfs`
```shell
# -- Console 1 --
ipfs daemon
```

Run `ganache`
```shell
# -- Console 2 --
# TODO: what about yarn init-ipfs?
# TODO: this does not seem mandatory in the node doc on Github
cd requestNetwork/packages/ethereum-storage
yarn run ganache
# TODO Choose either version
ganache-cli -l 90000000 -p 8545 -m \"candy maple cake sugar pudding cream honey rich smooth crumble sweet treat\"
```

Deploy the contracts and run the node
```shell
# -- Console 3 --
cd requestNetwork/packages/ethereum-storage
yarn run deploy
cd ../request-node
yarn run start

