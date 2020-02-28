---
title: How payment networks work
sidebar_label: Payment networks
keywords: [Request Client, Payment networks]

---

## Other currencies 
_VRO: this should be modified/added at the end of this section_

If you don't see a currency you would like to create request with, there is two options:
- Create a declarative request (see [declarative request](TODO))
- Contact us for your currency requirements: **Join the Request Hub** [**here**](https://join.slack.com/t/requesthub/shared_invite/enQtMjkwNDQwMzUwMjI3LWNlYTlmODViMmE3MzY0MWFiMTUzYmNiMWEyZmNiNWZhMjM3MTEzN2JkZTMxN2FhN2NmODFkNmU5MDBmOTUwMjA)
- Contribute to the protocol creating a dedicated payment network for this currency, by:
  - Writing the specification (following the [advanced logic specification](https://github.com/RequestNetwork/requestNetwork/blob/master/packages/advanced-logic/specs/advanced-logic-specs-0.1.0.md) and get inspired by the [others payment networks](https://github.com/RequestNetwork/requestNetwork/tree/master/packages/advanced-logic/specs))
  - Developing the new payment network in the [advanced-logic package](https://github.com/RequestNetwork/requestNetwork/tree/master/packages/advanced-logic/src/extensions/payment-network).
  - Developing the payment detection in the payment [payment-detection package](https://github.com/RequestNetwork/requestNetwork/tree/master/packages/payment-detection).
  - (OPTIONAL) Developing the payment processing in the [payment-processor package](https://github.com/RequestNetwork/requestNetwork/tree/master/packages/payment-detection)


# TODO

When a user creates and sends a request, he can expect to receive the correct amount of money. But how does he keep track of the payments due and received?

There are different methods available for the requester and payer to agree on the payment status, and that is when Payment networks come into play.

Payment networks allow developers to:
* Detect blockchain-based payment automatically
* Declare other kinds of payments completion

Request is blockchain agnostic, payment methods that are suppored for automated payment dection are: Bitcoin, Ether and ERC20. If you miss your favorite blockchain, you can either get in touch with the team or **TODO learn how to do it yourself**

## Ethereum and ERC20

Because one Ethereum address is generally used many times to receive and send transactions, we need a way to identify each payment. Request provides two payment channels for ETH and ERC20:

### Address-based payment detection
The payment channel `pn-erc20-address-based` can be used for one-shot address that will only receives payments for a single request.

Before using this payment channel, you then have to make sure you create two addresses: one for the payment (or payments if the request is paid in several parts), and one for the refund.

### Proxy-contract
This is the most convenient way for most use cases.

If you opt for the `pn-erc20-proxy-contract` payment channel, the flow for your users will be:

1. The user allows the smart contract to transfer funds from his address, up to a certain amount you choose.

2. He creates the request

3. Out of the request creation, you calculate the payment reference with `last8Bytes(hash(lowercase(requestId + salt + address)))`. **TODO: advise on what to do with the payment reference: store, share etc.**
4. The payer sends a transaction to the proxy contract with the payment reference.
5. The request balance is updated and if the amount is sufficient, its status turns to 'Paid'.

# REMOVE: Reference from previous docs
Detection made programatically:
Types.PAYMENT_NETWORK_ID.BITCOIN_ADDRESS_BASED ('pn-bitcoin-address-based'): handle Bitcoin payments associated to a BTC address to the request. Every transaction hitting this address will be consider as a payment. Eventually, the payer can provide a BTC address for the refunds. Note that the addresses must be used for one and only one request otherwise one transaction will be considered as a payment for more than one request. (see Bitcoin)
Types.PAYMENT_NETWORK_ID.TESTNET_BITCOIN_ADDRESS_BASED ('pn-testnet-bitcoin-address-based'): Same as previous but for the bitcoin testnet. (for test purpose) (see Bitcoin)
Types.PAYMENT_NETWORK_ID.ERC20_ADDRESS_BASED ('pn-erc20-address-based'): handle ERC20 payments to an unique Ethereum address associated with the request. Every transaction hitting this address will be consider as a payment. Eventually, the payer can provide an unique Ethereum address for the refunds. Note that the addresses must be used for one and only one request otherwise one transaction will be considered as a payment for more than one request. (see ERC20)
