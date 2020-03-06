---
title: Encryption with the API
sidebar_label: Encryption with the API
keywords: [Request, encryption, API]

---

# About encryption

By default, anything you store on Request can be read by anyone. That might be what you are looking for, or not!

To give you control over this, the Request Protocol supports end-to-end encryption. It means that no one outside of a request stakeholders (usually, its Payer and Payee) can read its information.

Request Portal API, however, **does not** offer end-to-end encryption, but **does** allow you to remove public access. 
What it means is that your request would be stored encrypted on the Network (Ethereum + IPFS) but we, at Request, could have access to the request data.

:::info
Although we technically have access to your Request data, we would never use or share this data.
We are planning to remove our own access to any encrypted data to provide end-to-end encryption with the API, while keeping the best possible experience for our builders.

If end-to-end encryption is paramount for your usage, we recommend you use the [Request Client](http://localhost:3000/docs/guides/5-request-client/0-intro) instead of the Portal API.
:::


# Handle encrypted requests

## Create an encrypted request

Creating an encrypted request with the API is very easy. You simply have to add `encrypted: true` to the payload. 

```javascript
const apiKey = "YOUR_API_KEY";
await axios.post(`https://api.request.network/requests/`,{
    currency: 'EUR',
    expectedAmount: "1000",
    payment: {
      type: 'declarative',
      value: {}
    },
    payer: {
      type: 'email',
      value: 'foo@bar.com'
    },
    encrypted: true
  },
  {
    headers: {
      Authorization: apiKey
    }
  })
```

## Specify the stakeholders
By default, you, as Payee and Creator of a request, will always be granted with Read access to the Request. 

If you specify a Payer that is also using Request Portal API, they will be given access to the Request as well. 

For other cases (Payer not using the API, thirdparty access), you can specify as many Public key as you want to the `stakeholders` field. To know more about the public key format, please refer to [this page](/TODO)


## Request decryption
Reading encrypted request(s) is the same as non-encrypted one(s), the API handles the decryption for you!
