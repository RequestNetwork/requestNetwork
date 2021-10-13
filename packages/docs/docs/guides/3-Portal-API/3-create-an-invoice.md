---
title: Invoice API - Introduction
keywords: [ERC20, DAI, Request, Invoice, Portal, API]
description: Learn how to integrate Request network and its features.

---

## Request vs. Invoice, what's the difference?

You are now familiar with the [Request API](./1-create-and-share-request.md), but did you know you could also create, on
Portal, Invoices which supersede Requests? How do they differ?

Invoices are simply an implementation of Requests with a predefined schema for the `contentData` property.
Invoices are mainly used by the [Request Invoicing](https://invoicing.request.network/) application
as a way to practically represent general invoicing data.

Invoice API also differ by the layer of automation added on top of Request API.
Whenever an Invoice is created, an email is sent to the designated payer.
The Invoice creator (payee) will also get notified as soon as the corresponding Request has been paid.

Knowing if a Request has been paid [is not trivial](./2-payment-status.md).
But Invoices have an additional property: a status
; so knowing if the underlying Request has been paid is as easy as reading this property.

Invoices can also be scheduled to create duplicates at regular intervals.
This is useful to manage collaborators salaries.

Invoices can also be approved before being paid,
notifying the payee the intent of remuneration of the payer,
once the agreement between the two parties is settled for instance.

## Introduction

In this tutorial we will learn how to use the Invoice API to create off-chain Invoices,
and then transform those Invoices into on-chain Requests.

Please follow the [Portal Introduction](./0-portal-intro.md) to retrieve an API key.
Reminder: all HTTP requests must include the following headers:

- `Accept: application/json`
- `Content-Type: application/json`
- `Authorization: [YOUR_API_KEY]`

The Authorization header is used to authenticate yourself.
Please replace `[YOUR_API_KEY]` with the previously retrieved key.

## Create a Request with Invoice API

### Create an off-chain Invoice

Use the following endpoint first to create an off-chain Invoice that will later be converted to an on-chain Request:

`POST https://api.request.network/invoices`

In the body part you can use the following example and replace the data accordingly:

```json
{
  "meta": {
    "format": "rnf_invoice",
    "version": "0.0.3"
  },
  "creationDate": "2021-09-22T14:38:16.916Z",
  // ISO-8601 date
  "invoiceItems": [
    {
      "currency": "USD",
      "name": "aaaoken name",
      "quantity": 10,
      "tax": {
        "type": "percentage",
        "amount": "20"
      },
      "unitPrice": "5700"
      // It is the price of one item, excluding taxes. Here it means the price of one aaaoken is $57.00. The total per item will be $68.40 including taxes, and the whole total will be $684.00
    }
  ],
  "invoiceNumber": "2",
  // This string has to be unique for each invoice created. It can be a number as well as a string.
  "buyerInfo": {
    "address": {
      "country-name": "France",
      "street-address": "5 Av. Anatole France",
      "extended-address": "Champ de Mars",
      "postal-code": "75007",
      "locality": "Paris"
    },
    "businessName": "Request Network",
    "email": "aaa-buyer-test@request.network",
    "taxRegistration": "tax number",
    "firstName": "Buyer First Name",
    "lastName": "Buyer Last Name"
  },
  "sellerInfo": {
    "businessName": "Request Network",
    "address": {
      "country-name": "AAA",
      "street-address": "aaa address line 1",
      "extended-address": "aaa address line 2",
      "postal-code": "aaa postal code",
      "region": "aaa region",
      "locality": "aaa city"
    },
    "email": "admin@aaa",
    "firstName": "Admin First Name",
    "lastName": "Admin Last Name",
    "taxRegistration": "tax number"
  },
  "paymentTerms": {
    "dueDate": "2021-10-22T21:59:59.999Z"
    // ISO-8601 date, last day the buyer can pay
  },
  "paymentAddress": "0x4886E85E192cdBC81d42D89256a81dAb990CDD74",
  // address which will receive the payment
  "paymentCurrency": "FAU-rinkeby",
  // FAU is a fake ERC-20 that we deployed on Rinkeby that is used when we select the DAI currency on the UI. On mainnet for your use case it will be xDAI-xdai or USDC-xdai
  "tags": [
    "Tag1",
    // optional, you can add several tags to the invoice
    "tag2"
  ]
}
```

In the JSON response you will get an “id” field. Please save it in a variable or in your database. You will need it in
the next section.

### Convert the off-chain Invoice into an on-chain Request

Use the following endpoint to convert the  previously created off-chain Invoice to an on-chain Request:

`POST https://api.request.network/invoices/[id]`

; and replace `[id]` with the previously saved Invoice ID.

You don't need to pass anything in the request body this time.

In the JSON response you will get a requestId field. This is the ID of the newly created Request. Please save it in your
database as you will need it to know when the Request has been paid.

### Know when the Request has been paid

We don’t have a  notion of webhooks implemented yet, you will need for now to poll our API regularly to be informed as to when the user
has paid its Request.

Please use the following endpoint to retrieve the status of the Request:

`GET https://api.request.network/invoices/[id] `

Replace `[id]` with the ID of the Invoice, or the ID of the Request (requestId). You can check the status field of the
JSON response. The different statuses of an Invoice are the following:
- `draft`
- `pending`
- `scheduled`
- `open`
- `accepted`
- `rejected`
- `declaredPaid`
- `paid`
- `canceled`

After creating the Request with the previously described process you should end-up with a `pending` status while the
Request is being created on-chain (as it is asynchronous), followed by an `open` status after the Request has actually
been created.

You can use the values `paid` to classify the payment as done and stop polling for a new status.

When the value matches `rejected` or `canceled` you can also stop polling because it means that the Request has been
manually canceled out by someone (meaning by the buyer or by the aaa admin before the Request got paid).

You should also terminate the polling process if the current date exceeds the `paymentTerms.dueDate` date.
