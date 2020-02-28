---

title: Handling encryption with the JS library
keywords: [Request, new currency, test network, missing currency, testnet]
---

A request can be encrypted. To manipulate encrypted request you need a Decryption Provider, e.g:

- Ethereum Private Key Decryption Provider, using directly the private keys
- A Browser extension is under development

You can also create your own decryption provider following the [specification](https://github.com/RequestNetwork/requestNetwork/blob/master/packages/transaction-manager/specs/decryption-provider.md). Feel free to contact us for any help or any idea about it: **Join the Request Hub** [**here**](https://join.slack.com/t/requesthub/shared_invite/enQtMjkwNDQwMzUwMjI3LWNlYTlmODViMmE3MzY0MWFiMTUzYmNiMWEyZmNiNWZhMjM3MTEzN2JkZTMxN2FhN2NmODFkNmU5MDBmOTUwMjA)

## Create an encrypted request

Ethereum Private Key Decryption Provider (see on [github](https://github.com/RequestNetwork/requestNetwork/tree/development/packages/epk-decryption))

```typescript
import EPKDecryptionProvider from '@requestnetwork/epk-decryption';

const decryptionProvider = new EPKDecryptionProvider({
  key: '0x4025da5692759add08f98f4b056c41c71916a671cedc7584a80d73adc7fb43c0',
  method: RequestNetwork.Types.Encryption.METHOD.ECIES,
});

const requestNetwork = new RequestNetwork({
  decryptionProvider,
  signatureProvider,
  useMockStorage: true,
});
```

Then you can create an encrypted request:

```typescript
const payeeEncryptionPublicKey = {
  key: 'cf4a1d0bbef8bf0e3fa479a9def565af1b22ea6266294061bfb430701b54a83699e3d47bf52e9f0224dcc29a02721810f1f624f1f70ea3cc5f1fb752cfed379d',
  method: RequestNetwork.Types.Encryption.METHOD.ECIES,
};
const payerEncryptionPublicKey = {
  key: '299708c07399c9b28e9870c4e643742f65c94683f35d1b3fc05d0478344ee0cc5a6a5e23f78b5ff8c93a04254232b32350c8672d2873677060d5095184dad422',
  method: RequestNetwork.Types.Encryption.METHOD.ECIES,
};

const invoice = await requestNetwork._createEncryptedRequest(
  {
    requestParameters,
    signer: requestParameters.payee,
    paymentNetwork,
  },
  [payeeEncryptionPublicKey, payerEncryptionPublicKey],
);
```

Note: your decryption provider must be able to decrypt the request. Otherwise an error will be trigger after the creation.

## Get invoice information from its request ID

Like a clear request you will be able to get it from its request id a request. You just need to have a decryption provider that can decrypt the request.

## Accepting / cancelling an invoice information

Like a clear request you will be able to update a request. You just need to have a decryption provider that can decrypt the request.
