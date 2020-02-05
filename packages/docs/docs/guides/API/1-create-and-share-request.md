---
title: Request API - Let's play
sidebar_label: API - Let's play
keywords:

---

# Create a request in DAI

Description of the use case, with personas, Rinkeby etc.

```jsx live
function justAnotherDAIRequest() {
  return(<div>Request created with ID: 123</div>);
}
```

You can check the request details in the [dashboard](https://dashboard.request.network/)

# How is the request paid?

First it has to be shared, explain the options with a decent UX and security.

Provide the payment page URL, ask to test.

# Wrap-up: request a payment form

```jsx live
function requestPaymentForm() {
	return(
		<div>
			Picture a basic form here
			Requester:  0x...
			Payer:			0x...
			Amount:			12.34	DAI
		</div>
	);
}
```
