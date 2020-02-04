---
title: Introduction
sidebar_label: Introduction
description: >-
  Welcome to Request. Learn everything about Request products, discover their
  advantages and explore their benefits.
---

import PageRef from '../../src/components/page-ref';

# Home

## Getting Started

Request enables companies and individuals to create, exchange and process invoices and payment requests through a global network.

To benefit from the features of the Request network, there a multiple ways to get started.

**The Request API**

Simplify interactions with the Request Protocol by abstracting all blockchain-related aspects. The Request REST API enables you to create requests, list requests and find a specific request by its ID.

<PageRef title="Getting started with the API" path="request-api/getting-started-with-request-api.md"/>

**The Request Protocol library & node**

Have greater control over the way you implement the Request network into your product. Deploy your own node and interact with the network using the Request Client library.

<PageRef title="Getting started with the Request Client" path="request-protocol/getting-started/introduction"/>

## What is Request?

By connecting transaction receipts \(invoices for B2B, purchase receipts for B2C and transaction receipts for C2C\) together with information flows from the payment industry, Request opens a wide range of new automation possibilities in corporate finance, particularly in invoicing, payments, tax collection, accounting and bookkeeping activities.

Request is the blockchain backbone of Supply Chain Finance, where buyers and sellers share trusted information which is immutable and time stamped for accounting purposes. Based on set permissions, financing institutions may be granted access at some stages of the transaction lifecycle in order to provide short-term credit options. This optimizes working capital and increase business efficiency for both the buyer and the seller

The blockchain based technology behind the Request protocol finally represents an opportunity for organizations to join a new paradigm, process transactions using digital asset \(tokenized assets, cryptocurrencies\) and benefit from smart contract possibilities to automate business relationships, enabling electronic invoices to become “smart objects“.

These "smart objects" are called **requests**. See below what are their properties, states and actions:

## Actions, States and Properties of a basic request <a id="actions-states-and-properties-of-a-request"></a>

A request has these Properties:

- **Payee**, identity of the payee
- **Payer**, identity of the payer
- **Expected Amount**, the amount expected to be paid
- **Creator,** identity of the creator of the request
- **Currency**
- **Request Id**, id of the request
- **State**, status of the request, can be:

  - **Created**
  - **Accepted**
  - **Canceled**

For the Issuer, initiator of the request \(payee\):

- **Create** a request
- **Cancel** a request
- **Add a subtract**. For example, refunds and discounts

For the recipient of the request \(payer\):

- **Create** a request
- **Accept** a request. It is useful to recognize an invoice which have a later due date. It is not mandatory to accept a request to pay it
- **Reject** \(cancel\) a request
- **Add an additional.** Increase the amount to be paid, for example, to add tips

## Payment detection, content data and more..

On a top of a basic request, extensions can be added to make a basic request a smarter object:

The two first extensions available are:

- **Payment detection** \(so called payment network\)
- **Content data:** the possibility to add any data to the minimum data set while initiating a transaction. This is the creation process of a “documented request” so called an Invoice

## Request API and Request Protocol don't fit my needs?

If you don't find what you are looking for with Request API and Request Protocol, you can directly develop using the lower level libraries of the Request Protocol. Feel free to contact us on the [Request Hub](https://requesthub.slack.com/join/shared_invite/enQtMjkwNDQwMzUwMjI3LWNlYTlmODViMmE3MzY0MWFiMTUzYmNiMWEyZmNiNWZhMjM3MTEzN2JkZTMxN2FhN2NmODFkNmU5MDBmOTUwMjA) for assistance!
