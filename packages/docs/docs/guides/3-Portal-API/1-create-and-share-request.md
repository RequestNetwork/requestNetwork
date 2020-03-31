---
title: Request API - Let's play
keywords: [ERC20, DAI, Request, Portal, API]
description: Learn how to integrate Request network and its features.

---

## Create a request in DAI

On this page, you will learn to create requests in DAI or in any ERC20, whose payment will be automatically detected. 

DAI is one of the most frequently used currencies on the Request network. As the most popular stablecoin, it allows merchants and e-commerce software builders to propose blockchain-powered payments, finance, and accounting, without having to deal with the change risks.

The Portal can detect payments of requests in ETH, BTC, and ERC20. After the example below, you will understand that smart invoices can open many use cases and that reconciliation processes between bank statements and accounting is already outdated.

### Prerequisites

Before you execute the code below, don't forget to:

* Change the `API_KEY`, with your test API key
* Change the payment value with one of your Ethereum addresses

Even if for this tests the transaction will be done over the Rinkeby network, it's more realistic to configure your own address.

And now, let's look at the code:

```jsx
import ReactDOM from "react-dom";
import React, {useState} from "react";
import axios from "axios";
import { ethers } from "ethers";

const API_KEY = "YOUR_API_KEY";

function CreateDAIRequest() {

  const [paymentLink, setPaymentLink] = useState([]);

  async function createRequest() {

    // When the button is clicked, make a POST query to create the request
    const result = await axios.post(
      `https://api.request.network/requests/`,
      {

        // The same works with any ERC20
        currency: "DAI",

        // Here we want to create a $49.99 request
        expectedAmount: ethers.utils.parseUnits("49.99", 18).toString(),
        payment: {

          // Proxy contract: the payment will be detected automatically 
          // and the same address can be used several times
          type: "erc20-proxy-contract",

          // This is where the funds will come, you probably want to put your address
          value: "0xAa0c45D2877373ad1AB2aa5Eab15563301e9b7b3"
        }
      },
      {
        headers: {
          Authorization: API_KEY
        }
      }
    );

    // Once the query returns, we know the request ID
    // The payment page can only query and show the request once it is broadcasted over Ethereum.
    setPaymentLink("https://pay.request.network/" + result.data['requestId']);
    return result.data['requestId'];
  }

  return (
    <>
      <button onClick={createRequest}>Click me to create a request</button>
      <a href={paymentLink} rel="noopener noreferrer" target="_blank">{paymentLink}</a>
    </>
  );
}

const rootElement = document.getElementById("root");
ReactDOM.render(<CreateDAIRequest />, rootElement);

```

Try it! By clicking on the button, a request is created and with its ID, we display the payment page URL. There are several ways to pay a request, we will come back on that later, but the payment page is the most convenient to start. Did you notice that Metamask did not prompt you? That's because the Portal takes care of the blockchain transaction, as well as the fees.

Now **what happens if you click on the payment link right after the request creation?**

The payment page throws a "Your request was not found" error, why?

Remember that the Portal abstracts the blockchain access. By doing so, a request created on the portal does not exist on every node of the network, yet. And the payment page is another node on the network.

**To summarize, before you can access the payment page, you need to wait a few seconds.**

You can check the request status and details in the [dashboard](https://dashboard.request.network/)


## Sharing the request to get paid

Once a user has created a request, you need to support him alerting the payer.

The first way is to let the user share a payment URL with the payer. From a UX point of view, it forces him to switch context, but mobile apps often propose this solution. Keep in mind that for the recipient, it looks more secure to click on a link directly sent by a known contact. The best payment page so far is the one we have made, check it out! You can find the link in front of each request on your dashboard. The URL is `https://pay.request.network/{requestId}`

Another way is to handle the notification in your backend, either within your app (if the payer also uses it) or with an e-mail for example. For app-embedded payment requests, it is **strongly advised** to provide the payer with a white-list feature, and to prevent him from clicking on requests sent by strangers.

Whatever the solution you pick, you should consider the UX / security tradeoff with great attention.
