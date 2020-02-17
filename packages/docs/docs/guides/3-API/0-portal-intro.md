---
title: Portal Introduction
keywords: Request, REST, API, Tutorial, Portal

---

import useBaseUrl from '@docusaurus/useBaseUrl';


# Introduction

Request Portal simplifies the use of the Request protocol, abstracting all the blockchain complexity. You can create requests and manage your users' requests through a REST API.

Our API accepts JSON-encoded request bodies, returns JSON-encoded responses, and uses standard HTTP response codes and Bearer authentication.

Aside the guide, you can also consult [the API documentation](https://api-docs.request.network/).

# Action
## Request identity and API Key

If you have not already done it, head towards [the Request dashboard](https://dashboard.request.network) and create your account.

Once your account is created, you are able to:

- Create a request, which is useful for manual testing for example
- List requests you sent or received, useful for debugging
- Access your API key, by clicking on your account and then Settings.


<img alt="Getthing the API key from the Portal" src={useBaseUrl('img/portal-api-key.gif')} />


You have two API keys, use the Test one to follow this guide.

## How to list the requests associated to your identity

Head to the Portal to create a first manual request, and use the snipet below to fetch requests associated to your identity

```jsx
import ReactDOM from "react-dom";
import React, { useState, useEffect } from "react";
import axios from "axios";

const API_KEY = "YOUR-API-KEY";

function RequestsList() {
  const [requests, setRequests] = useState([]);

  useEffect(() => {
    const fetchResult = async () => {
      const result = await axios.get("https://api.request.network/requests/", {
        headers: { Authorization: API_KEY }
      });
      console.log(result);
      setRequests(result.data);
    };
    fetchResult();
  }, []);

  return (
    <div className="App">
      <h2>The most basic list of payment requests</h2>
      <ul>
        {requests.map(request => {
          return (
            <li key={request.requestId}>
              {request.requestInput.expectedAmount}{" "}
              {request.requestInput.currency}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

const rootElement = document.getElementById("root");
ReactDOM.render(<RequestsList />, rootElement);

```

The expected result should but a list of requests with amounts and currencies. Depending on your currency, some amounts seem too big. We will see later how to display amounts properly.
