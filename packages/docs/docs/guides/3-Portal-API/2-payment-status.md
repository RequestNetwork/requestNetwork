---
title: Payment status with the Portal API
sidebar_label: Payment status
keywords:
description: Learn how to integrate Request network and its features.

---

After creation, each request has a payment status, you can view the metadata of a request which contains the payment status via:

```jsx
const requestData = request.getData();
```

You will receive back an object that looks like this: 
```jsx
/*
{ 
  balance,
  state,
  expectedAmount,
}
*/
```

To get the payment status of a Request you can use the requestData object to check if the balance is greater than or equal to the expectedAmount. 

If the balance >= expectedAmount - this means the request is paid.
If the balance > 0 but < expectedAmount - this means the request is partially paid.
If the balance == 0 - this means the request is unpaid.

You can use the following snippet to see if the request has been paid. 

```jsx
// Import Big Number package
const BN = require('bn.js')

(async () => {
  // Check the balance of the request
  const requestData = request.getData();
  const balance = requestData.balance;
  console.log(`Balance of the request in ETH: ${balance}`);
  
  // Check if the request has been paid
  // Convert the balance to big number type for comparison
  const expectedAmount = new BN(requestData.expectedAmount);
  const balanceBigNumber = new BN(balance);

  // Check if balanceBigNumber is greater or equal to expectedAmount
  const paid = balanceBigNumber.gte(expectedAmount);
})(); 
```

If the Request is unpaid, it might be useful to use the metadata field called ‘state’ - the state will return the current payment status of the request, either ‘created’, ‘accepted’, ‘pending’ or ‘canceled’.
