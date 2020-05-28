---
title: How payment networks work
sidebar_label: Payment networks
keywords: [Request Client, Payment networks]
description: Learn how to integrate Request network and its features.

---
import SupportedErc20 from '../../../src/components/supported-erc20';

When a user creates and sends a request, he expects to receive the correct amount of money. But how does he keep track of the payments due and received? Request is a ledger that documents requests for payment and how to agree on their completion.

There are different methods available for the payee and payer to agree on the payment status, and that is when payment networks come into play. **A payment network is a predefined set of rules on how to agree on the payment status of a specific request.**

A payment network is defined by:
* The information, defined at the request creation, necessary to be able to detect payments
* A payment method, the method used to perform a detectable payment
* A payment detection method, the process to determine the amount paid by the payer through the payment method

## Types of payment detection

There are three ways to get consensus on a payment status.

### Address based

For these payment networks, a request contains a payment address that is unique to the request.
The balance of the request is computed by reading all the inbound transfers to the payment address. To pay the request, the payer performs a normal transfer to the payment address.
Outbound transfers are not taken into consideration to compute the request's balance.
The address must be created exclusively for the request since every inbound transfer to the addresses is considered a payment. For example, if a Bitcoin request is created with a payment address that has already received 1 BTC, the request balance will be 1 BTC even though the payee hasn't received any funds from the payer.

For address based payment requests, the refund address also has to be exclusive to this payment refund.

### Reference based

For these payment networks, a request contains one payment address. This address doesn't have to be exclusive to the request.
The balance is computed by reading transfers to the payment address containing a specific payment reference, defined by the request ID and payment address.

For ETH, we can tag and detect the payment reference directly in the transaction, using the `input data` field of the transaction.

When we cannot use `input data` or equivalent, typically for ERC20, we use a *proxy smart contract* to document the payment reference.
The smart contract forwards a currency transfer and stores a reference.

If you need the proxy smart contract addresses, we list the most relevant ones below.

[Proxy smart contracts for ERC20](https://github.com/RequestNetwork/requestNetwork/blob/master/packages/smart-contracts/artifacts/ERC20Proxy/artifacts.json):
```json
"mainnet": {
	"address": "0x5f821c20947ff9be22e823edc5b3c709b33121b3",
},
"rinkeby": {
	"address": "0x162edb802fae75b9ee4288345735008ba51a4ec9",
}
```
[Proxy smart contracts for ETH when input data cannot be used](https://github.com/RequestNetwork/requestNetwork/blob/master/packages/smart-contracts/artifacts/EthereumProxy/artifacts.json):
```json
"mainnet": {
	"address": "0x37a8f5f64f2a84f2377481537f04d2a59c9f59b6",
},
"rinkeby": {
	"address": "0x9c6c7817e3679c4b3f9ef9486001eae5aaed25ff",
}
```

For reference based payment requests, the references for the main payment and the refund are different.

### Declarative

For these payment networks, the request doesn't require any additional data. The request's stakeholders declare sending and receiving payments or refunds manually. Optionally, the creator of the request can specify the information to describe how the payment should occur, but this data will not be used to detect the payment. 
The payee declares the received payments and the payer declares the received refunds. The balance of the request is the sum of declared payments minus the sum of declared refunds.
The payee can also declare the sent refunds and the payer the sent payments. These declarations are used only for documentation purposes and aren't taken into consideration to compute the request balance.

This type of payment network can be used with every currency.

## Currencies

The currencies that are supported for automated payment detection are
* Bitcoin
* Ether
* ERC20

### Bitcoin

A Bitcoin request requires an address based payment network.
This payment network is sufficient for Bitcoin requests because generating a new address for every inbound BTC transfers is already part of Bitcoin's good practices.

### Ether

Because one Ethereum address is generally used many times to receive and send transactions, we need a way to identify payments for a specific request without having to create a new address. Therefore, we use a reference-based payment network for ether requests.
*Input data* and *proxy contract* methods can be used to reference the ether transfer. 

### ERC20

Request is compatible with every ERC20 currency, but some of them have to be detailed manually. We use Metamask's package [`eth-contract-metadata`](https://github.com/MetaMask/eth-contract-metadata) to automatically fetch smart contracts and currency codes of main currencies.

#### Listed ERC-20:

<SupportedErc20 />

For listed ERC20 currencies, you can use the code directly.
```typescript
// New request for most common currencies, such as DAI or BAT:
const request = await requestNetwork.createRequest({
  paymentNetwork,
  requestInfo: {
    currency: 'DAI',
    expectedAmount: '1000000000000000000',
    payee: payeeIdentity,
    payer: payerIdentity,
  },
  signer: payeeIdentity,
});
```

For additional ERC20 tokens, or specific neworks, you have to mention the contract address and network identifier.
```typescript
const request = await requestNetwork.createRequest({
  paymentNetwork,
  requestInfo: {
    currency: {
      network: 'mainnet',
      type: RequestLogicTypes.CURRENCY.ERC20,
      value: '0xdac17f958d2ee523a2206206994597c13d831ec7', // USDT
    },
    expectedAmount: '1000',
    payee: payeeIdentity,
    payer: payerIdentity,
  },
  signer: payeeIdentity,
});
```

The most convenient way to implement ERC20 requests is with a *proxy contract* payment network.
Note that the smart contract deployed for ERC20 tokens is different than the one deployed for ether.

ERC20 requests payment detection can also be address based, but using the proxy contract payment network is the most convenient.

### Other currencies 

If you would like to create a request with a currency we don't support, you have two options:
- Create a declarative request
- Contact us for your currency requirements: **Join the Request Hub** [**here**](https://join.slack.com/t/requesthub/shared_invite/enQtMjkwNDQwMzUwMjI3LWNlYTlmODViMmE3MzY0MWFiMTUzYmNiMWEyZmNiNWZhMjM3MTEzN2JkZTMxN2FhN2NmODFkNmU5MDBmOTUwMjA)
- Contribute to the protocol creating a dedicated payment network for this currency, by:
  - Writing the specification (following the [advanced logic specification](https://github.com/RequestNetwork/requestNetwork/blob/master/packages/advanced-logic/specs/advanced-logic-specs-0.1.0.md) and get inspired by the [others payment networks](https://github.com/RequestNetwork/requestNetwork/tree/master/packages/advanced-logic/specs))
  - Developing the new payment network in the [advanced-logic package](https://github.com/RequestNetwork/requestNetwork/tree/master/packages/advanced-logic/src/extensions/payment-network).
  - Developing the payment detection in the payment [payment-detection package](https://github.com/RequestNetwork/requestNetwork/tree/master/packages/payment-detection).
  - (OPTIONAL) Developing the payment processing in the [payment-processor package](https://github.com/RequestNetwork/requestNetwork/tree/master/packages/payment-processor)
