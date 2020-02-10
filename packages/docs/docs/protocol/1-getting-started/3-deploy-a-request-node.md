---
title: Deploy a Request Node
sidebar_label: Deploy a Request Node
---

## Host a Request Node

Request Nodes are HTTP servers used to allow any client to communicate with the Request Protocol, these servers abstract the complexity of IPFS and Ethereum for the users. The users can easily create a request or execute an action on a request by sending messages to the Node via HTTP.

More details on the request nodes can be found on [github](https://github.com/RequestNetwork/requestNetwork/tree/development/packages/request-node).

### Deploying a node for local development environment

You may want to deploy your own node in a development environment. This is how:

```bash
git clone https://github.com/RequestNetwork/requestNetwork.git
```

Open 3 console windows:

- Console 1: IPFS
  - Install and setup an IPFS node, as [explained here](../5-request-ipfs-network)
  - Run `ipfs daemon`
- Console 2: ganache
  - `cd packages/smart-contracts`
  - `yarn run ganache`
- Console 3: deploy the contracts and run the node
  - `cd packages/smart-coontracts`
  - `yarn run deploy`
  - `cd ../request-node`
  - `yarn run start`

### Deploying your own node in production

Follow the steps on the [request-node package readme](https://github.com/RequestNetwork/requestNetwork/tree/development/packages/request-node#deployment).
