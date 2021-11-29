---
title: Payment status with the Portal API
sidebar_label: Payment status
description: Learn how to integrate Request network and its features.
---

After creation, each request has a payment status, you can view the data of a request which contains the payment status via:

```jsx
const result = await axios.get(`https://api.request.network/requests/${requestId}`);
const request = result.data.request;
```

You will receive back an object that looks like this:

```jsx
/*
{ 
  balance,
  state,
  expectedAmount,
  ...
}
*/
```

To get the payment status of a Request you can use the requestData object to check if the balance is greater than or equal to the expectedAmount.

If `balance.balance >= expectedAmount`: this means the request is paid (or even overpaid)
If `balance.balance > 0 && balance.balance < expectedAmount`: this means the request is partially paid.
If `balance.balance === 0`: this means the request is unpaid.

You can use the following snippet to see if the request has been paid.

```jsx
import { BigNumber } from 'ethers';
(async () => {
  // Check the balance of the request
  const result = await axios.get(`https://api.request.network/requests/${requestId}`);
  const request = result.data.request;

  const balanceObject = request.balance;

  if (!balanceObject) {
    console.error('balance no set');
    return;
  }
  if (balanceObject.error) {
    console.error(balanceObject.error.message);
    return;
  }

  console.log(`Balance of the request in ETH: ${balanceObject.balance}`);

  // Check if the request has been paid
  // Convert the balance to big number type for comparison
  const expectedAmount = BigNumber.from(requestData.expectedAmount);
  const balanceBigNumber = BigNumber.from(balanceObject.balance);

  // Check if balanceBigNumber is greater or equal to expectedAmount
  const paid = balanceBigNumber.gte(expectedAmount);
})();
```

If the Request is unpaid, it might be useful to use the metadata field called ‘state’ - the state will return the current payment status of the request, either ‘created’, ‘accepted’, ‘pending’ or ‘canceled’.
