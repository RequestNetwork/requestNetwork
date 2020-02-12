---
title: Portal Introduction
keywords: Request, REST, API, Tutorial, Portal

---


# Introduction

TODO: Introduce the portal features and the the API tutorial

# Action
## Request identity and API Key

We should point to the other page?

If you have not already done it, head towards [the Request dashboard](https://dashboard.request.network) and create your account.

Once your account is created, you are able to:

- Create a request, which is useful for manual testing for example
- List requests you sent or received, useful for debugging
- Access your API key, by clicking on your account and then Settings.

TODO: some picture of the API key or settings screen

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
