---
title: How payment networks work
sidebar_label: Payment networks
keywords: [Request Client, Payment networks]

---

When a user creates and sends a request, he expects to receive the correct amount of money. But how does he keep track of the payments due and received? Request is a ledger that documents requests for payment but doesn't directly interact with any external blockchain, where the payment happens. 

There are different methods available for the requester and payer to agree on the payment status, and that is when payment networks come into play. A payment network is a specific context on how to agree on the payment status of a specific request.

A payment network is defined by:
* An extension in the Request protocol that defines the necessary information to be able to detect payments
* A payment method, it's the method used to perform a detectable payment
* A payment detection method, it's the process to determine the amount paid by the payer through the payment method

For example, the Address-Based Bitcoin payment network, `pn-bitcoin-address-based`, allowing to detect Bitcoin payments through unique Bitcoin addresses created for the request's payments and refunds. For this payment network:
* The Request protocol's extension stores the Bitcoin payment and refund addresses of the request
* The payment method is to perform a simple Bitcoin transfer to the payment or the refund address
* The payment detection method is to read the inbound BTC transfers into the payment Bitcoin address to determine the paid amount and to read the inbound BTC transfers into the refund Bitcoin address to determine refunded amount

Note that these characteristics are almost the same for every address-based payment network.

For most payment networks, the payment method can be performed by the payer without any interaction with the Request protocol or the Request client.
For all payment networks, the Request client can perform the payment detection method to determine the balance of a request.

Currencies that are supported for automated payment detection are Bitcoin, Ether, and ERC20. If you miss your favorite blockchain, you can either get in touch with the team or learn how to do it yourself.

## Bitcoin

Generating a new address for every inbound BTC transfers is already part of the Bitcoin's good practices. Therefore, Request only has one payment network for bitcoin: `pn-bitcoin-address-based`.

## Ether

Because one Ethereum address is generally used many times to receive and send transactions, we need a way to identify payments for a specific request without having to create a new address. This is why the payment network for ether is based on a reference: `pn-ethereum-input-data`.

The reference is a hash defined by the request id and the payment address (to detect payments) or the refund address (to detect refunds). This reference is either inserted into the Ethereum transaction's input data or documented through a *proxy contract*, a smart contract that forwards ether transfers and stores references.

There are two ways to document the reference:
* Insert the reference in the Ethereum transfer input data when sending ethers to the payment address
* Call the `transferWithReference` method of the Ethereum proxy smart contract with the payment address and the reference as parameters

## ERC20

ERC20 tokens are based on Ethereum and therefore also use Ethereum addresses. Though we provide an address based payment network. 

### Address-based payment network
The payment channel `pn-erc20-address-based` can be used for one-shot address that will only receive payments for a single request.

Before using this payment channel, you then have to make sure you create two addresses: one for the payment (or payments if the request is paid in several parts), and one for the refund.

### Proxy-contract payment network
This is the most convenient way for most use cases. This method is similar to using the proxy contract with `pn-ethereum-input-data`. Note that the smart contract deployed for ERC20 tokens is different than the one deployed for ether.

## Declarative requests

A request using the declarative payment network allows the payee and the payer to declare the payments and refunds they create and receive.
In such a request the balance is computed only regarding the declaration made by these two stakeholders.

## Other currencies 

If you don't see a currency you would like to create request with, there is two options:
- Create a declarative request (see [declarative request](TODO))
- Contact us for your currency requirements: **Join the Request Hub** [**here**](https://join.slack.com/t/requesthub/shared_invite/enQtMjkwNDQwMzUwMjI3LWNlYTlmODViMmE3MzY0MWFiMTUzYmNiMWEyZmNiNWZhMjM3MTEzN2JkZTMxN2FhN2NmODFkNmU5MDBmOTUwMjA)
- Contribute to the protocol creating a dedicated payment network for this currency, by:
  - Writing the specification (following the [advanced logic specification](https://github.com/RequestNetwork/requestNetwork/blob/master/packages/advanced-logic/specs/advanced-logic-specs-0.1.0.md) and get inspired by the [others payment networks](https://github.com/RequestNetwork/requestNetwork/tree/master/packages/advanced-logic/specs))
  - Developing the new payment network in the [advanced-logic package](https://github.com/RequestNetwork/requestNetwork/tree/master/packages/advanced-logic/src/extensions/payment-network).
  - Developing the payment detection in the payment [payment-detection package](https://github.com/RequestNetwork/requestNetwork/tree/master/packages/payment-detection).
  - (OPTIONAL) Developing the payment processing in the [payment-processor package](https://github.com/RequestNetwork/requestNetwork/tree/master/packages/payment-detection)
