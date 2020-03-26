---
title: Create your first Request
sidebar_label: First request creation
keywords: [Request creation, API]
description: Learn how to integrate Request network and its features.

---

import useBaseUrl from '@docusaurus/useBaseUrl';

Get an outlook of the Request network in a matter of minutes with the API.

:::info
This is a very fast ramp to the Request network, using the Portal API, a centralized option.
If you want to jump to the decentralized options, head towards the [Request Client section](./5-request-client/0-intro.md).
:::

## Request identity and API Key

Head towards [the Request Portal dashboard](https://dashboard.request.network) and create your account, you will need it to get your API keys and pursue the first steps of Request.


<img alt="Getthing the API key from the Portal" src={useBaseUrl('img/portal-api-key.gif')} />

More info about the Request Portal [in the next section](./3-Portal-API/0-portal-intro.md).

## Create your first request

To create a payment request or invoice, you must create a basic Request object which outlines some information such as the receiving payment address, which payment network is being used, the currency and the amount expected. 

```jsx
const axios = require('axios')

const API_KEY = 'YOUR_API_KEY';
const requestParams = {
  "currency": "BTC",
  "expectedAmount": "100000000",
  "payment": {
    "type": "bitcoin-testnet",
    "value": "mgcZRSj6ngfKBUHr2DGBqCfHSSYBDSbjph"
  },
};

const request = await axios.post('https://api.request.network/requests', requestParams, {
  headers: { Authorization: API_KEY }
})

console.log(request.data);
```

The `data` object contains a `requestId` field that you can use for other API calls. 

## Check that it worked

You can check that the request was created by heading towards [the list of requests in your dashboard](https://dashboard.request.network). The request should be listed on top of the list.

By clicking on the request row, you can see the details.

You can see that the status is Pending: the request has not been paid yet. We will deal with payment detection [later](./3-Portal-API/2-payment-status.md).

## Wrap-up

The request created is proof that some money has been requested by a person or company, and its pending status the proof that the money is still due.

In the next sections, you will also see how to transform such a basic creation into seamless financial workflows:

* For the payer who can pay in one click, because we have all the information he needs

* For the requester to keep track of his due payments
