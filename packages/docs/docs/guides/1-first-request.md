---
title: Create your first Request
sidebar_label: First request creation
keywords:

description: >-
  This API Is currently in Beta, its specification may change in the future. We
  do not recommend production usage yet.
---

<!--TODO: keywords-->

import Hint from '../../src/components/hint.js';

Get an outlook of the Request network in a matter of minutes with the API.

## Request identity and API Key

Head towards [the Request dashboard](https://dashboard.request.network) and create your account, you will need it to get your API keys and pursue the first steps of Request.

Once your account is created, you should be able to:

- Create a request, which is useful for manual testing for example
- List requests you sent or received, useful for debugging
- Access your API key, by clicking on your account and then Settings.

You have two API keys, use the Test one for all these tutorials.

## Create your first request

```jsx live
function hereYouGo() {
		requestId = 43;
		return(<a href="https://pay.request.network/">{requestId}TODO-Share this payment link</a>);
}
```
```jsx live
function createFirstRequest() {
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

	requestId = request.data.requestId;
	return(<div>
					Request created with ID: {requestId}
				</div>
				<a href="https://pay.request.network/{requestId}">Share this payment link</a>);
}
```

## Check that it worked

You can check that the request was created by heading towards [the list of requests in your dashboard](https://dashboard.request.network/dashboard). The request should be listed on top of the list.

By clicking on the request row, you can also cross-check the request details.

You can see that the status is Pending: the request has not been paid yet. We will deal with payment detection [later]().

## Wrap-up

The request created is the proof that some money has been requested by a user, and its pending status the proof that the money is still due.

In the next steps, we will see how to transform such a basic creation into seamless financial workflows:

* For the payer who can pay in one click, because we have all the information he needs

* For the requester to keep track of his due payments
