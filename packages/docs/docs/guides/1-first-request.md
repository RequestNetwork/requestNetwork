---
title: Create your first Request
sidebar_label: First request creation
keywords: [Request creation, API]
description: Learn how to integrate Request network and its features.
---

import useBaseUrl from '@docusaurus/useBaseUrl';

Get an outlook of the Request network in a matter of minutes with the API.

:::info
This is a very fast ramp to the Request network, using the Portal API.
If you want to jump to the decentralized options, head towards the [Request Client section](./5-request-client/0-intro.md).
:::

## Request identity and API Key

Head towards [Request Invoicing](https://invoicing.request.network) and create your account, you will need it to get your API keys and pursue the first steps of Request. Once you logged in, go to [My Account > API](https://invoicing.request.network/account/api-keys) to get your API Key.

More info about the Request Portal [in the next section](./3-Portal-API/0-portal-intro.md).

## Create your first request

To create a payment request or invoice, you must create a basic Request object which outlines some information such as the receiving payment address, which payment network is being used, the currency and the amount expected.

```jsx
const axios = require('axios');

const API_KEY = 'YOUR_API_KEY';
const requestParams = {
  currency: 'USDC',
  // 100 USDC
  expectedAmount: '100000000',
  payment: {
    type: 'erc20-proxy-contract',
    value: '0x4E64C2d06d19D13061e62E291b2C4e9fe5679b93',
  },
};

try {
  const request = await axios.post('https://api.request.network/requests', requestParams, {
    headers: { Authorization: API_KEY },
  });

  if (request.data?.requestId) {
    console.log(request.data);
    console.log(`https://pay.request.network/${request.data.requestId}`);
  } else {
    console.log(`Error, something went wrong fetching the requestId.`);
  }
} catch (e: any) {
  console.error(
    `Failed creating the request (${e.response.status}) with message: ${JSON.stringify(
      e.response.data
    )}`
  );
}
```

The `data` object contains a `requestId` field that you can use for other API calls.

## Check that it worked

You can check that the request was created by heading towards the payment page whose URL was printed in the last step.

You can see that the status is Pending: the request has not been paid yet. We will deal with payment detection [later](./3-Portal-API/2-payment-status.md).

## Wrap-up

The request created is proof that some money has been requested by a person, company or DAO, and its pending status the proof that the money is still due.

In the next sections, you will also see how to transform such a basic creation into seamless financial workflows:

- For the payer who can pay in one click, because we have all the information he needs

- For the requester to keep track of his due payments
