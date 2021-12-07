---
title: Non-EVM chains
keywords: [Request payments, payment proxy, blockchain]
description: Technical specifications for a payment proxy developments
---

:::info
EVM blockchains with web3 support are not concerned by this documentation, reach out to us.
:::

# How to invoice with tokens on a new blockchain?

To support a new blockchain as a base for payments, Request Finance needs these components:

- A paymentProxy smart contract
- Front-end methods to initiate the payment transaction (including helpers for UX)
- Methods to detect the payment and compute the balance
- Helpers to validate an address

Nb: This documentation focuses on payments, requests hashes don’t have to be published to the same chain as payments. Request Finance currently uses xDai for storage, whatever the payment chain.

## PaymentProxy smart contract

This is needed ONLY for one of these cases:

- CASE 1: Contract-based currencies such as ERC20 (without custom data)
- CASE 2: Native coins for blockchains where we cannot send input data with the transaction
- CASE 3: Native coins with some payments expected to be done by smart wallets

[Cf. the specifications for the Ethreum-based ERC20 proxy with fee](https://github.com/RequestNetwork/requestNetwork/blob/master/packages/advanced-logic/specs/payment-network-erc20-fee-proxy-contract-0.1.0.md)

The code should be strictly equivalent to [the Ethereum version](https://etherscan.io/address/0x370de27fdb7d1ff1e1baa7d11c5820a324cf623c#code).
You can find several other payment contracts on our Github: https://github.com/RequestNetwork/requestNetwork/tree/master/packages/smart-contracts/test/contracts

The exact details of the payments should be retrievable in an event sent by the contract as follow:

```
  event TransferWithReferenceAndFee(
    address tokenAddress,
    address to,
    uint256 amount,
    bytes indexed paymentReference,
    uint256 feeAmount,
    address feeAddress
  );
```

For native tokens, the event does not reference the token address.

## Initiate the payment transaction

These front-end methods are needed to let the user pay with a good UX:

- Get the current wallet address (for user experience)
- Get the wallet balance for a given payment token
- Get the allowance amount, if applicable, for the proxy contract (approval need ?)
- Send a transaction to approve the given token to be spent by the proxy, if applicable
- Send the payment with all required information (including the paymentReference)

[Cf. examples in our repo.](https://github.com/RequestNetwork/requestNetwork/tree/master/packages/payment-processor)

## Detect the payment

All the methods below should be callable from a back-end (for caching purpose) and a front-end (for dapp usage). The state-of-the-art is to have a subgraph indexing payment for each chain, but RPC calls are valid if you know stable RPC providers able to query the whole history for the given chain.

[Cf. examples in our repo.](https://github.com/RequestNetwork/requestNetwork/tree/master/packages/payment-detection)

### Index events sent by the proxy

We need a way to query events by paymentReference, as this is the way we can retrieve the payment status of one specific invoice.

### Get notified of events sent by the proxy

What is the preferred way to be notified of new interesting events ?

### Get details of the events

For each payment we retrieve the parameters to, amount and paymentReference. Additionally, gas fees and transaction hash are relevant information for the end user.

### Blockchain explorer link helper

Get the link for users to access the transaction details.

## Validate an address

What are the methods used to validate an address format?

# Deliverables

[Reach out to us](https://discord.gg/q7cRv4hT) when you are ready with:

- Contract code, PR on our repo
- Deployed contract (at least on a testnet, for the POCs below)
- Testnet faucet explanations
- POC with front-end methods to process a payment for given `paymentReference`, amount and currency
- POC with typescript code that can retrieve all Request payments periodically (ex: from the last block)
- POC with typescript code that can retrieve Request payments for one paymentReference
- Subraph or RPC node URL
- Any advice or feedback is welcome :)
