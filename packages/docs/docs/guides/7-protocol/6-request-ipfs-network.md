---
title: Request IPFS network
sidebar_label: Request IPFS network
description: Learn how to integrate Request network and its features.
---

## Why Request uses IPFS?

Request uses IPFS to store transaction data in a decentralized way. Transactions are actions done on a request, for example: create, accept, reject...

When files are stored in IPFS, they are kept locally on the IPFS node, and are accessible by any node connected to the network. To access this file IPFS [creates a unique hash](https://medium.com/textileio/whats-really-happening-when-you-add-a-file-to-ipfs-ae3b8b5e4b0f) that identifies the file. We store this hash on the Request smart contract to have a trustless list of transactions.

## Why Request uses a dedicated IPFS network?

The main IPFS network has tens of thousands of nodes and a huge amount of files. All of the Request transactions are a tiny fraction of the IPFS network. To find a transaction file, the Request Node IPFS has to [traverse many nodes](https://medium.com/textileio/how-the-ipfs-dht-works-47af8bfd3c6a) on the network. Content retrieval is currently quite slow on IPFS.

By creating a dedicated IPFS network for Request, our network is isolated from the rest of the IPFS network. This means that all the Request IPFS nodes will only communicate with other Request Nodes. By keeping the network small, we can make sure most nodes are connected between themselves and asking for files can be done directly to a node instead of through a traversal.

This is a big advantage for us because our nodes end goal is different from that of a normal IPFS node: all the IPFS nodes used by a Request Node should have all the files on the network. This makes the DHT pointless, and the most important factor in discovery time becomes how many nodes every node is connected to.

These are the main reason why we created the Request IPFS network.

## The Request IPFS Network

IPFS has a feature called **private network**. It allows IPFS nodes that share a private key to communicate only among themselves and keep their files private from the open IPFS network. We use this feature to create an IPFS network that is separate from the open one, but we keep this key public. This way, we have a public network that is separate from the open network.

We also changed some default IPFS configurations on our network, to improve performance and responsiveness. The main change we did is disabling the DHT, so instead of traversing the network to find a file, the nodes will only ask to their neighbor nodes for those files. Since on our network every node is supposed to have every transaction file, those responses tend to be a lot faster \(on most of our test cases the response time went from seconds to a few hundred milliseconds\).

## Run our IPFS node Docker image

We distribute a Docker image of our configured IPFS node.
To run it, you can use the command:

```bash
docker run -p 5001:5001 -p 4001:4001 requestnetwork/request-ipfs
```

### Configure your IPFS node to use the Request IPFS network

There are two easy ways to connect an IPFS node to the Request Network:

- Use the [requestnetwork/request-ipfs](https://hub.docker.com/r/requestnetwork/request-ipfs) docker image to run your IPFS. It comes pre-configured and you just need to run it.
- [Use the `init-ipfs`](https://github.com/RequestNetwork/requestNetwork-private/blob/development/packages/ethereum-storage/scripts/init-ipfs.js) script available from the [Request Node package](https://github.com/RequestNetwork/requestNetwork-private/tree/development/packages/request-node) or the [Ethereum Storage package](https://github.com/RequestNetwork/requestNetwork-private/tree/development/packages/ethereum-storage).

```bash
yarn init-ipfs
```

### Setting up your IFPS by hand

If you want to set up your IPFS node yourself, here is the information you would need:

#### The swarm key

you should put this file at your IPFS path \(usually in \$IPFS_PATH\)

**swarm.key** file content:

```text
/key/swarm/psk/1.0.0/
/base16/
5f3af0599d991e5eb4c37da2472aa299759ee3350ba26c125d0c7579dd04dd52
```

#### The configurations

```bash
# Initialize IPFS
ipfs init

# Setup the Request IPFS Network bootstraps
ipfs bootstrap rm --all
ipfs bootstrap add /dns4/ipfs-bootstrap.request.network/tcp/4001/ipfs/QmaSrBXFBaupfeGMTuigswtKtsthbVaSonurjTV967Fdxx
ipfs bootstrap add /dns4/ipfs-bootstrap-2.request.network/tcp/4001/ipfs/QmYdcSoVNU1axgSnkRAyHtwsKiSvFHXeVvRonGCAV9LVEj
ipfs bootstrap add /dns4/ipfs-2.request.network/tcp/4001/ipfs/QmPBPgTDVjveRu6KjGVMYixkCSgGtVyV8aUe6wGQeLZFVd
ipfs bootstrap add /dns4/ipfs-survival.request.network/tcp/4001/ipfs/Qmb6a5DH45k8JwLdLVZUhRhv1rnANpsbXjtsH41esGhNCh

# Disable the DHT
ipfs config Routing.Type none

# Environment variable to forbid IPFS to connect to the open IPFS network
export LIBP2P_FORCE_PNET=1
```
