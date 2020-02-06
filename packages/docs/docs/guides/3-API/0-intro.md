---
title: Request with a REST API
sidebar_label: First steps with the REST API
keywords: Request, REST, API, Tutorial

---


# Introduction

This section guides you through the usage of the Request REST API

# Action
## Request identity and API Key

We should point to the other page?

This step is only needed if you interact with Request through an API. You can jump to [the Request client] if you want to use the JavaScript library instead.

Head towards [the Request dashboard](https://dashboard.request.network) and create your account, you will need it to get your API keys and pursue the first steps of Request.

Once your account is created, you should be able to:

- Create a request, which is useful for manual testing for example
- List requests you sent or received, useful for debugging
- Access your API key, by clicking on your account and then Settings.

You have two API keys, use the Test one for all these tutorials.

## How to list the requests associated to your identity

```jsx live
const API_KEY = 'REPLACE-ME';

const result = await axios.get(
	"https://api.request.network/requests/" + requestId, {
		headers: { Authorization: API_KEY }
	}
);
```

## Check that it worked

You can check that the request was created by heading towards [the list of requests in your dashboard](https://dashboard.request.network/dashboard). The request should be listed on top of the list.

By clicking on the request row, you can also cross-check the request details.

You can see that the status is Pending: your request has not been paid yet. We will deal with payment detection [later]().

<!--TODO-->
