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

In this section, you will create and share your first request within minutes.

## Request identity and API Key

This step is only needed if you interact with Request through an API. You can jump to [the Request client] if you want to use the JavaScript library instead.

Head towards [the Request dashboard](https://dashboard.request.network) and create your account, you will need it to get your API keys and pursue the first steps of Request.

Once your account is created, you should be able to:

- Create a request, which is useful for manual testing for example
- List requests you sent or received, useful for debugging
- Access your API key, by clicking on your account and then Settings.

You have two API keys, use the Test one for all these tutorials.

## Create your first request

```jsx live
const API_KEY = 'REPLACE-ME';
// Obviously we are missing the live interpretor here

// TODO: code to create a request
```

## Check that it worked

You can check that the request was created by heading towards [the list of requests in your dashboard](https://dashboard.request.network/dashboard). The request should be listed on top of the list.

By clicking on the request row, you can also cross-check the request details.

You can see that the status is Pending: your request has not been paid yet. We will deal with payment detection [later]().

<!--TODO-->
