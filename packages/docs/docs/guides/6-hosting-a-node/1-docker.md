---
title: Running a node with Docker
keywords: [Request node, setup, docker]
description: Learn how to integrate Request network and its features.
---

Running a Request Node with Docker is easy. There are only a few requirements:

- Docker installed on your system;
- A web3 provider (we recommend using a service like [infura](https://infura.io));
- An Ethereum wallet with some funds for gas (if you plan on creating requests through this node);

## Launching the IPFS node

To launch the IPFS node run:

```bash
docker run -p 5001:5001 -p 4001:4001 requestnetwork/request-ipfs
```

This command will launch the IPFS node with Request network configurations.

## Launching the Request Node

To launch the Request node you can run:

```bash
docker run -p 3000:3000 -e MNEMONIC="<your wallet mnemonic>" -e WEB3_PROVIDER_URL="<your web3 provider url>" -e ETHEREUM_NETWORK_ID="<ethereum network id>" -e IPFS_HOST="host.docker.internal"  requestnetwork/request-node
```

The environment variables passed to the script are:

- **MNEMONIC** should be the node wallet mnemonic seed.
- **WEB3_PROVIDER_URL** should be the URL to your web3 provider.
- **ETHEREUM_NETWORK_ID** should be either `1` for Mainnet or `4` for Rinkeby.
- **IPFS_HOST** is the URL of your IPFS node. Here we use the Docker host URL.

That's it! Now your Node should be running and syncing to the network.
Give it some minutes to finish synchronizing and its API will be available on `http://localhost:3000`.

If you want to know more about the available options you can pass to the node, you can [check them here](https://github.com/RequestNetwork/requestNetwork/tree/master/packages/request-node#options).

## Using Docker Compose

We can (and should) use docker-compose to make it simpler to launch your local Request Node.
With [Docker Compose](https://docs.docker.com/compose/) installed, use the following `docker-compose.yml` file:

```yml
version: '3.1'

services:
  request-node:
    image: requestnetwork/request-node
    environment:
      IPFS_HOST: ipfs
      ETHEREUM_NETWORK_ID: 4
      WEB3_PROVIDER_URL: https://rinkeby.infura.io/v3/<your API key>
      MNEMONIC: <your Mnemonic>
    ports:
      - '3000:3000'
    depends_on:
      - ipfs

  ipfs:
    image: requestnetwork/request-ipfs
    ports:
      - '4001'
      - '5001'
```

Now you can run:

```bash
docker-compose up
```

Your node should start initializing.
