---
title: Deploying a node in Kubernetes with Helm
keywords: [Request node, helm, kubernetes]
---

Deploying a Request Node on Kubernetes is straightforward using our [helm](https://helm.sh/) chart.

You can see our chart in our [git repository](https://github.com/RequestNetwork/request-helm-charts/tree/master/request-node).

## Adding the chart

We host our chart on our own helm repo, since we upgrade it frequently.
To add our chart you can run:

```bash
helm repo add request https://request-charts.storage.googleapis.com
helm repo update
```

## Installing the chart

To install our chart with the release name `my-release`, you can run:

```bash
helm install --name my-release request/request-node
```

You will need to set up some required values, like mnemonic, web3ProviderUrl (you can use [infura](https://www.infura.io) API) and networkId (either `1` for mainnet or `4` for Rinkeby).

You can check out all our chart configuration options [here](https://github.com/RequestNetwork/request-helm-charts/tree/master/request-node#configuration).
