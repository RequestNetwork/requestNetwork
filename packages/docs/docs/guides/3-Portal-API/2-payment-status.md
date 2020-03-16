---
title: Payment status with the Portal API
sidebar_label: Payment status
keywords:

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

If the Request is unpaid, attached to metadata is a field called ‘state’ - the state will return the current payment status of the request, either ‘created’, ‘accepted’, ‘pending’ or ‘cancelled’.