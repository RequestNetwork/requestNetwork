---
title: Payment page
keywords: Request payment library, request payment page

---


# Introduction

We will develop a basic page that allows users to:

1. Give a request ID
2. Ensure they have enough funds
3. Authorize the proxy contract
4. Pay (through the proxy contract)

TODO: disclaimer about dependency on the request client?

# How to pay a request?

Prerequisites:
* TODO
* TODO

```jsx live
import React from "react";
import { ethers } from "ethers";
import { Web3Provider } from "ethers/providers";
import { useWeb3React, Web3ReactProvider } from "@web3-react/core";
import { InjectedConnector } from "@web3-react/injected-connector";
import { RequestNetwork } from "@requestnetwork/request-client.js";

import { payRequest, hasSufficientFunds } from "pay-with-request";

const requestNetwork = new RequestNetwork({
  nodeConnectionConfig: {
    baseURL: "https://gateway-rinkeby.request.network"
  }
});

const Request = ({ requestId }) => {
  const { account, active, activate } = useWeb3React();
  const [request, setRequest] = React.useState();
  const [error, setError] = React.useState();
  const [enoughMoney, setEnoughMoney] = React.useState();

  const pay = async () => {
    try {
      await payRequest(request, account);
    } catch (e) {
      setError(e);
    }
  };

  React.useEffect(() => {
    activate(new InjectedConnector({}));
  }, [activate]);

  React.useEffect(() => {
    setRequest();
    requestNetwork
      .fromRequestId(requestId)
      .then(r => r.getData())
      .then(data => setRequest(data))
      .catch(setError);
  }, [requestId]);

  React.useEffect(() => {
    if (request && active) {
      hasSufficientFunds(request, account)
        .then(setEnoughMoney)
        .catch(setError);
    }
  }, [request, account, active]);

  if (!active) {
    return <div>Metamask not connected</div>;
  }

  return (
    <div>
      <pre>{JSON.stringify(error)}</pre>
      {request && (
        <>
          <p>Has enough money: {enoughMoney ? "Yes" : "No"}</p>
          <button onClick={pay}>
            Pay {ethers.utils.formatEther(request.expectedAmount)}{" "}
            {request.currency}
          </button>
        </>
      )}
    </div>
  );
};

export default function App() {
  const [requestId, setRequestId] = React.useState(
    ""
  );
  return (
    <Web3ReactProvider getLibrary={provider => new Web3Provider(provider)}>
      <input value={requestId} onChange={e => setRequestId(e.target.value)} />
      <Request requestId={requestId} />
    </Web3ReactProvider>
  );
}

```

