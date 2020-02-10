---
title: Bitcoin
sidebar_label: Bitcoin
description: >-
  This section describe how the payments and the refunds detection are made
  using Bitcoin as currency of a request.
---

The balance of a Bitcoin Request can be computed automatically.

First, One address for the payment and one for the refund must be created and used exclusively for **one and only one** request.

Then, the payment network _**"pn-bitcoin-address-based"**_ must be given when creating a Bitcoin request:

```javascript
const requestParameters = {
  currency: 'BTC',
  expectedAmount: '100000000000',
  payee: {
    type: IdentityTypes.TYPE.ETHEREUM_ADDRESS,
    value: '0x627306090abab3a6e1400e9345bc60c78a8bef57',
  },
};
const paymentNetwork = {
  id: RequestNetwork.Types.PAYMENT_NETWORK_ID.BITCOIN_ADDRESS_BASED,
  parameters: {
    paymentAddress: '1C83GMLVipjVMVaeV6BQkhfECT3TFADsfX',
  },
};
const invoice = await requestNetwork.createRequest({
  requestParameters,
  signer: requestParameters.payee,
  paymentNetwork,
});
```

Any bitcoin transaction reaching the payment address given \(here _`"1C83GMLVipjVMVaeV6BQkhfECT3TFADsfX"`_\) is considered as a payment.

In the same way, the payer can add a refund address. For example when accepting the request:

```typescript
await request.accept(payerIdentity, {
  refundAddress: '1HorouyEMqtbHAvmnRj1XxEH4FL2uSiZpS',
});
```

Any bitcoin transaction reaching the refund address given \(here _`"1HorouyEMqtbHAvmnRj1XxEH4FL2uSiZpS"`_\) is considered as a refund.

Note: To avoid counting change outputs, the bitcoin transactions having as input AND as ouput, the same payment or refund addresses are ignored.

### Bitcoin Testnet

To use this payment network with the Bitcoin testnet, just use _**"pn-testnet-bitcoin-address-based"**_ in the same way.

```javascript
const paymentNetwork = {
  id: RequestNetwork.Types.PAYMENT_NETWORK_ID.TESTNET_BITCOIN_ADDRESS_BASED,
  parameters: {
    paymentAddress: 'mgPKDuVmuS9oeE2D9VPiCQriyU14wxWS1v',
  },
};
```

### Resources

Specification Bitcoin payment specification: [here](https://github.com/RequestNetwork/requestNetwork/blob/development/packages/advanced-logic/specs/payment-network-btc-address-based-0.1.0-DRAFT.md).
