---
title: How payment networks work
sidebar_label: Payment networks
keywords: [Request Client, Payment networks]
description: Learn how to integrate Request network and its features.

---

When a user creates and sends a request, he expects to receive the correct amount of money. But how does he keep track of the payments due and received? Request is a ledger that documents requests for payment but doesn't directly interact with any external blockchain where the payment happens. 

There are different methods available for the payee and payer to agree on the payment status, and that is when payment networks come into play. **A payment network is a predefined set of rules on how to agree on the payment status of a specific request.**

A payment network is defined by:
* The information, defined at the request creation, necessary to be able to detect payments
* A payment method, the method used to perform a detectable payment
* A payment detection method, the process to determine the amount paid by the payer through the payment method

## Types of payment network

There are currently three types of payment network.

### Address based

For this payment network, a request contains one payment address.
The balance of the request is computed by reading all the inbound transfers to the payment address. To pay the request, the payer has to perform a normal transfer to the payment address.
Outbound transfers are not taken into consideration to compute the request's balance.
The address must be created exclusively for the request since every inbound transfer to the addresses are considered as payments. For example, if a Bitcoin request is created with a payment address that has already received 1 BTC, the request balance will be 1 BTC even though the payee hasn't received any funds from the payer.

Similar to the payment address, in this payment network, we can set a refund address that follows the same rules (it also needs to be exclusive to the request). The final balance of the request will be substracted by the inbound transfers to the refund address.

### Reference based

For this payment network, a request contains one payment address. This address doesn't have to be exclusive to the request.
The balance is computed by reading transfers to the payment address containing a specific reference.
The reference is a number defined by the request id and the payment address.
There can be different ways to document the reference through the transfer. We currently define two methods that depend on the currency:
* Through input data
* Through a proxy smart contract

Similar to the payment address, in this payment network, we can set a refund address that follows the same rules. The reference will be specific for the refunds.

#### Input data:

In certain cases, when transferring a currency amount, the user has the choice to add additional data to the transaction. For example, Ethereum allows the user to add miscellaneous data named *input data* when performing a simple ether transfer.
In this case, the payment reference is documented here.

#### Proxy smart contract:

In this case, the reference is documented through a proxy smart contract.
This is a smart contract that forwards a currency transfer and stores a reference.
The currency must be backed by a blockchain with smart contract capabilities.

### Declarative

For this payment network, the request doesn't require any additional data. The request's stakeholders declare sending and receiving payments and refunds manually. Optionally, the creator of the request can specify the information to describe how the payment should occur, but this data will not be used to detect the payment. 
The payee declares the received payments and the payer declares the received refunds. The balance of the request is the sum of declared payments minus the sum of declared refunds.
The payee can also declare the sent refunds and the payer the sent payments. These declarations are used only for documentation purposes and aren't taken into consideration to compute the request balance.

This payment network can be used with every currency.

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

ERC20 tokens are based on Ethereum and therefore also use Ethereum addresses.
We allow the creation of ERC20 requests with *proxy contract* payment network. *Input data* can't be specified for ERC20 transfers.
Note that the smart contract deployed for ERC20 tokens is different than the one deployed for ether.

We also provide the address based payment network for ERC20 requests but using the proxy contract payment network is the most convenient way for most use cases.

### Other currencies 

If you would like to create a request with a currency we don't support, you have two options:
- Create a declarative request
- Contact us for your currency requirements: **Join the Request Hub** [**here**](https://join.slack.com/t/requesthub/shared_invite/enQtMjkwNDQwMzUwMjI3LWNlYTlmODViMmE3MzY0MWFiMTUzYmNiMWEyZmNiNWZhMjM3MTEzN2JkZTMxN2FhN2NmODFkNmU5MDBmOTUwMjA)
- Contribute to the protocol creating a dedicated payment network for this currency, by:
  - Writing the specification (following the [advanced logic specification](https://github.com/RequestNetwork/requestNetwork/blob/master/packages/advanced-logic/specs/advanced-logic-specs-0.1.0.md) and get inspired by the [others payment networks](https://github.com/RequestNetwork/requestNetwork/tree/master/packages/advanced-logic/specs))
  - Developing the new payment network in the [advanced-logic package](https://github.com/RequestNetwork/requestNetwork/tree/master/packages/advanced-logic/src/extensions/payment-network).
  - Developing the payment detection in the payment [payment-detection package](https://github.com/RequestNetwork/requestNetwork/tree/master/packages/payment-detection).
  - (OPTIONAL) Developing the payment processing in the [payment-processor package](https://github.com/RequestNetwork/requestNetwork/tree/master/packages/payment-processor)
