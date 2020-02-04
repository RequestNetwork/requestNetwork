---
title: ERC 20 (DAI, REQ, ...)
sidebar_label: ERC 20 (DAI, REQ, ...)

description: >-
  This section describe how the payments and the refunds detection are made
  using ERC20 as currency of a request.
---

The balance of an ERC20 Request can be computed automatically.

Two different payment networks can be used to detect ERC20 requests: **ERC20 proxy contract** and **ERC20 address based**.

### Proxy Contract

The **Proxy Contract** payment network uses a smart-contract that will relay the request payment to the payment address.
While relaying the funds, this contract will store some information to link this payment to the correct request, allowing the payment detection automation to check this contract for payments.
The main advantage of this method is that payment and refund addresses can be reused for several requests.

The payment network "**pn-erc20-proxy-contract**" must be given when creating an ERC20 request.

```javascript
const requestParameters = {
  currency: 'REQ',
  expectedAmount: '1000000000000000000',
  payee: {
    type: IdentityTypes.TYPE.ETHEREUM_ADDRESS,
    value: '0x627306090abab3a6e1400e9345bc60c78a8bef57',
  },
};
const paymentNetwork = {
  id: RequestNetwork.Types.PAYMENT_NETWORK_ID.ERC20_PROXY_CONTRACT,
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

The ERC20Proxy smart contract is available on Ethereum [mainnet](https://etherscan.io/address/0x5f821c20947ff9be22e823edc5b3c709b33121b3) and [Rinkeby testnet](https://rinkeby.etherscan.io/address/0x162edb802fae75b9ee4288345735008ba51a4ec9).

The user also has to provide a payment reference to link the payments to the request. The payment reference is the last 8 bytes of a salted hash of the requestId: `last8Bytes(hash(lowercase(requestId + salt + address)))`.
Salt is necessary to not leak information and preserve privacy. The same salt is used for payments and refunds, but the payment and refund references are different. The salt is generated automatically and in most cases you won't need to worry about it.

If you want to compute the payment reference, you can fo it like this:

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

Any payments documented in the ERC20 proxy contract with the correct reference is considered as a payment for the request.

### Address based

For address based payments, one address for the payment and one for the refund must be created and used exclusively for **one and only one** request.

Then, the payment network "**pn-erc20-address-based**" must be given when creating an ERC20 request:

```javascript
const requestParameters = {
  currency: 'REQ',
  expectedAmount: '1000000000000000000',
  payee: {
    type: IdentityTypes.TYPE.ETHEREUM_ADDRESS,
    value: '0x627306090abab3a6e1400e9345bc60c78a8bef57',
  },
};
const paymentNetwork = {
  id: RequestNetwork.Types.PAYMENT_NETWORK_ID.ERC20_ADDRESS_BASED,
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

Any ERC20 transaction for the request currency reaching the payment address given \(here `REQ` and `0xf17f52151EbEF6C7334FAD080c5704D77216b732`\) is considered as a payment.

In the same way, the payer can add a refund address. For example when accepting the request:

```typescript
await request.accept(payerIdentity, {
  refundAddress: '0xC5fdf4076b8F3A5357c5E395ab970B5B54098Fef',
});
```
