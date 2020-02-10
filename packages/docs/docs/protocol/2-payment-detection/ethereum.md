---
title: Ethereum
sidebar_label: Ethereum

description: >-
  This section describe how the payments and the refunds detection are made
  using ETH as currency of a request.
---

The balance of an ETH request can be computed automatically. A payment reference has to be given in input data when making the transfer to link the payment to the request. The payment reference is the last 8 bytes of a salted hash of the requestId: `last8Bytes(hash(lowercase(requestId + salt + address)))`

Every transfer to the payment address made with the payment reference will count as payment.
Every transfer to the refund address made with the refund payment reference will count as payment.

Salt is necessary to not leak information and preserve privacy. The same salt is used for payments and refunds, but the payment and refund references are different. The salt is generated automatically and in most cases you won't need to worry about it:

```javascript
const requestParameters = {
  currency: 'ETH',
  expectedAmount: '1000000000000000000',
  payee: {
    type: IdentityTypes.TYPE.ETHEREUM_ADDRESS,
    value: '0x627306090abab3a6e1400e9345bc60c78a8bef57',
  },
};

const paymentNetwork = {
  id: RequestNetwork.Types.PAYMENT_NETWORK_ID.ETH_INPUT_DATA,
  parameters: {
    paymentAddress: '0xf17f52151EbEF6C7334FAD080c5704D77216b732',
  },
};

const invoice = await requestNetwork.createRequest({
  requestParameters,
  signer: requestParameters.payee,
  paymentNetwork,
});
```

You can compute the payment reference like this:

```javascript
import { PaymentReferenceCalculator } from '@requestnetwork/request-client.js';
const paymentReference = PaymentReferenceCalculator.calculate(requestId, salt, paymentAddress);
```

If you need to specify a fixed salt, you can generate it yourself and give it when create the request:

```javascript
const paymentNetwork = {
  id: RequestNetwork.Types.PAYMENT_NETWORK_ID.ETH_INPUT_DATA,
  parameters: {
    paymentAddress: '0xf17f52151EbEF6C7334FAD080c5704D77216b732',
    salt: 'ea3bc7caf64110ca',
  },
};
```
