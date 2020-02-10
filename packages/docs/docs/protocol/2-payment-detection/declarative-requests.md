---
title: Declarative Requests
sidebar_label: Declarative Requests

description: >-
  A request using the declarative payment network allows the payee and the payer
  to declare the payments and refunds they create and receive.
---

A request using the declarative payment network allows the payee and the payer to declare the payments and refunds they create and receive.

In such a request the balance is computed only regarding the declaration made by these two stakeholders.

You can find a complete example in the request github repository: [https://github.com/RequestNetwork/requestNetwork/tree/master/packages/usage-examples/src/request-client-js-declarative-request.ts](https://github.com/RequestNetwork/requestNetwork/blob/development/packages/usage-examples/src/request-client-js-declarative-request.ts)

### Creation

Creation of a declarative request with the request-client library is made by giving the declarative payment network, e.g:

```typescript
const paymentNetwork: RequestNetwork.Types.IPaymentNetworkCreateParameters = {
  id: RequestNetwork.Types.PAYMENT_NETWORK_ID.DECLARATIVE,
  parameters: {
    paymentInformation: {
      IBAN: 'FR89370400440532013000',
      BIC: 'SABAIE2D',
    },
  },
};
```

```typescript
const request = await requestNetwork.createRequest({
  paymentNetwork,
  requestInfo,
  payeeIdentity,
});
```

### Functions

After the creation, the payee can:

- Add payment information if it was not given at the creation:

```typescript
await request.addPaymentInformation(
  {
    IBAN: 'FR89370400440532013000',
    BIC: 'SABAIE2D',
  },
  payeeIdentity,
);
```

- Declare received payment:

```typescript
await request.declareReceivedPayment('10900', 'payment received', payeeIdentity);
```

- Declare sent refund:

```typescript
await request.declareSentRefund('1000', 'refund initiated from the bank', payeeIdentity);
```

The payer can:

- Add refund information if it was not given at the creation:

```typescript
await request.addRefundInformation(
  { IBAN: 'DE7777700440532013000', BIC: 'DDBBIE1D' },
  payerIdentity,
);
```

- Declare received refund:

```typescript
await request.declareReceivedRefund('700', 'refund received', payerIdentity);
```

Declare sent payment:

```typescript
await request.declareSentPayment('11000', 'payment initiated from the bank', payerIdentity);
```

### Balance computation

At the creation, the balance is 0. Then:

- The balance is incremented when `declareReceivedPayment()`
- The balance is reduced `when declareReceivedRefund()`

The other functions are just a way to share information:

- A payment may have been done when `declareSentPayment()`
- A refund may have been done when `declareReceivedRefund()`
