---
title: Pay a request
keywords: [Request payment library]
description: Learn how to integrate Request network and its features.

---


## Introduction

In the previous sections, you have learned how to create a request for payment. We will now explain to you how to pay it. 

This section is useful if:
* You plan to embed request payment features like a Pay button
* You want to test the payment stage of requests you create

The payment of a request depends on its [payment network](../5-request-client/1-payment-networks.md#types-of-payment-network): 

- Address-based payment networks (available for BTC and ERC20) don't have any specific requirement: any payment sent to the specified address will be considered a payment of this request. Never re-use an address!
- Input data payment networks (ETH only) simply requires you to specify the [Payment Reference](https://github.com/RequestNetwork/requestNetwork/blob/master/packages/advanced-logic/specs/payment-network-eth-input-data-0.2.0.md#description) in the data of the transaction.
- Proxy payment networks (ETH and ERC20) require you to call a smart contract method that forwards the payment.

To simplify the payment procedures of the various payment networks, you can use the dedicated library, [@requestnetwork/payment-processor](https://www.npmjs.com/package/@requestnetwork/payment-processor). 
On top of calculating the Payment Reference and handling the transaction for you, it provides a few utilities to ensure the user meets all requirements to pay the request (enough funds for example)


## About the payment-processor library

### Install

```bash
npm install @requestnetwork/payment-processor
# or
yarn add @requestnetwork/payment-processor
```


### Usage

#### ETH request

```typescript
import { hasSufficientFunds, payRequest } from "@requestnetwork/payment-processor";

const requestNetwork = new RequestNetwork();

// usually, the connected account.
const account = "[WALLET_ADDRESS]";

const request = await requestNetwork.fromRequestId('[REQUEST_ID]');
const requestData = request.getData();
if (!(await hasSufficientFunds(requestData, account))) {
  throw new Error('You do not have enough funds to pay this request');
}
const tx = await payRequest(requestData);
await tx.wait(1);
```
:::info For Rinkeby testing
The request currency should be `ETH-rinkeby`.
:::

#### ERC20 request
```typescript
import {
  approveErc20,
  hasErc20Approval,
  hasSufficientFunds,
  payRequest
} from "@requestnetwork/payment-processor";

// usually, the connected account.
const account = "[WALLET_ADDRESS]";

const requestNetwork = new RequestNetwork();

const request = await requestNetwork.fromRequestId('[REQUEST_ID]');
const requestData = request.getData();
if (!(await hasSufficientFunds(requestData, account))) {
  throw new Error('You do not have enough funds to pay this request');
}
if (!(await hasErc20Approval(requestData, account))) {
  const approvalTx = await approveErc20(requestData);
  await approvalTx.wait(1);
}
const tx = await payRequest(requestData);
await tx.wait(1);
```

:::info About ERC20 Contract Approval
Because an ERC20 transaction cannot contain input data, we need to go through a smart contract to document the payment. The user must allow this contract to spend tokens on its behalf. Read more [here](https://medium.com/ethex-market/erc20-approve-allow-explained-88d6de921ce9)
:::

