---
title: Request Client introduction
keywords: [Request Client, JS Library]

---

Collecting payments on your project consists of using the Request Client to create a request, detect the payment, and provide status updates of the Request.

This package allows you to interact with the Request blockchain through the Request nodes. This client-side library uses Request nodes as servers, which are connected in HTTP. 

You can view the documentation about the [Request Node here](/docs/guides/6-hosting-a-node/0-intro).

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
 // Replace it with the URL of the node you want to use, instead
 nodeConnectionConfig: { baseURL: 'https://gateway-rinkeby.request.network/' },
});
```

TODO: Explain how to access the mainnet gateway
