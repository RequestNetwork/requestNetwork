---
title: Introduction to Request Node hosting
keywords: [Request node]
description: Learn how to integrate Request network and its features.
---

Now you should be comfortable with features of the Request network.

In this guide, we will explain what is the Request Node and help you to run your own.

## What is the Request Node?

Request Nodes are servers that run the lower layers of the Request Protocol. They connect to the Ethereum and IPFS networks, to store and retrieve request transactions. Protocol users can interact with the Request Node through HTTP using the [request-client.js](../5-request-client/0-intro.md) library.

## Why run your own Node?

First, running the Node locally on your machine will allow you to test your code using the Request Client easily.

You may also want to host your Node in a server. Hosting your Node is the most decentralized setup possible. It allows you to:

- Store your data and make sure it is safely backed up
- Be technically independent: own your servers and control how you manage them
- Use custom configuration settings

## How to run your Node?

There are currently three supported ways to run a Request Node:

- Run from [**Docker**](./1-docker.md). The easiest way to run the Request Node.
- Run the [**code**](./2-code.md) from the git repository. Especially useful if you are making changes to the protocol layers.
- Use our kubernetes [**helm**](./3-helm.md) charts. The best solution if you want to host your Node on a Kubernetes cluster.

On the next pages, you can find out detailed steps on how to run each one of these.

## Prerequisites

Request uses IPFS and Ethereum to store request transactions. For this reason, the Node needs connections to an Ethereum node and an IPFS node.

### Ethereum node

You can use any HTTP/S Ethereum node to run your Request Node.
For local development, you can use ganache-cli, a local Ethereum RPC client for tests (explained in more detail on the following pages).

An easy way to get going with Ethereum Mainnet or Rinkeby is to use services like Infura, that will expose an Ethereum node API for you.

### IPFS node

Request uses a dedicated IPFS network to store our data. This means that you will need an IPFS node configured to connect to our network. You can check [this page](../7-protocol/6-request-ipfs-network.md) if you want more details on our dedicated network.

The good news is it's easy to set up our IPFS node and we will show it to you on our next steps.
