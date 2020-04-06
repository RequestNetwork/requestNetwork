---
title: Request Network Client introduction
sidebar_label: Introduction
keywords: [Request Network Client, JS Library]
description: Learn how to integrate Request network and its features.

---

Collecting payments on your project consists of using the Request Client to create a request, detect the payment, and provide status updates of the Request.

This package allows you to interact with the Request blockchain through the Request nodes. This client-side library uses Request nodes as servers, which are connected in HTTP. 

You can view the documentation about the [Request Node here](../6-hosting-a-node/0-intro.md).

It ships both as a commonjs and a UMD module. This means you can use it in node application and in web pages.
Request uses this library, to track and handle all the states of the payment until it’s completed.

1. Install the Request Client
```shell
# install the request js library
npm install @requestnetwork/request-client.js
# install a request signature provider (e.g: web3-signature to use Metamask)
npm install @requestnetwork/web3-signature
```

2. Import the client
```jsx
import { RequestNetwork } from '@requestnetwork/request-client.js'

const RequestNetwork = require('@requestnetwork/request-client.js');
```

3. Configure the node

```jsx
const requestNetwork = new RequestNetwork({
 // The Rinkeby Gateway is the node hosted by Request
 // You can use it on the Rinkeby network without limit, for testing and discovery of the library
 nodeConnectionConfig: { baseURL: 'https://gateway-rinkeby.request.network/' },
});
```

4. What node should you use?

In order to follow this guide or test your integration, you should use `https://gateway-rinkeby.request.network`.

For production, you have two options, [compared in the integrations section](/integration-options):

* If you want to host your own Request Node, [have a look at the next section](../6-hosting-a-node/0-intro.md)

* If you prefer to use a node as a service, Request hosts one for you at this location: `https://gateway.request.network`. For the moment, it comes free of charges and fees. If you reach the limit or want to know more, [get in touch with us!](https://join.slack.com/t/requesthub/shared_invite/enQtMjkwNDQwMzUwMjI3LWNlYTlmODViMmE3MzY0MWFiMTUzYmNiMWEyZmNiNWZhMjM3MTEzN2JkZTMxN2FhN2NmODFkNmU5MDBmOTUwMjA)
