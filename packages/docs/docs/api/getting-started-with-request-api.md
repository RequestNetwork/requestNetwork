---
title: Getting Started with the Request API
sidebar_label: Getting Started

description: >-
  This API Is currently in Beta, its specification may change in the future. We
  do not recommend production usage yet.
---

# Getting Started

## Getting Started with the Request API

The Request API is a REST API that enables you to create requests, list requests, and find a specific request by its ID. Its purpose is to simplify interaction with the Request Protocol, abstracting all Blockchain-related aspects.‌‌

Our API accepts [JSON-encoded](http://www.json.org/) request bodies, returns [JSON-encoded](http://www.json.org/) responses, and uses standard HTTP response codes and Bearer authentication.‌‌

Before using the API you must create an account [here](https://dashboard.request.network/signup), and retrieve your **test** API Key \(which will run on the Rinkeby Ethereum Test network\). If you would like to verify your code on Ethereum Mainnet, you may use the **live** API Key.

:::note Please note
If you would like to run a completely decentralized version of the Request network you can [deploy your own node](../guides/6-hosting-a-node/0-intro.md) and interact with the network using the [Request Client](../guides/5-request-client/0-intro.md)​‌.
:::

## API Specs and Structure

You can view the full API spec [here](/portal).

### API Requests

To construct a REST API request, combine these components:

| Component                                                      | Description                                                                                                                    |
| -------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| HTTP method                                                    | `GET` Requests data from a resource. <br/>`POST` Submits data to a resource to process.                                        |
| API URL                                                        | `https://api.request.network`                                                                                                  |
| URI Path                                                       | The resource to query, submit data to, update, or delete. For example, `requests/<requestId>`                                  |
| [Query Parameters](https://en.wikipedia.org/wiki/Query_string) | Optional. Controls which data appears in the response. Use to filter,,limit the size of, and sort the data in an API response. |
| HTTP Request Headers                                           | Includes the `Authorization` header with the access token. See,the authorization section for more details.                     |
| JSON request body                                              | Required for some endpoints, and details in the specs.                                                                         |

## Authentication

The Request API uses API keys to authenticate requests. You can view and manage your API keys using your [Request Account](http://baguette-dashboard.request.network/)‌‌.

Your API keys carry many privileges, so be sure to keep them secure! Do not share your secret API keys in publicly accessible areas such as GitHub, client-side code, and so forth.‌‌

All API requests must be made over [HTTPS](http://en.wikipedia.org/wiki/HTTP_Secure). Calls made over plain HTTP will fail. API requests without authentication will also fail.‌‌

### HTTP Status Code Summary

| Status Code          | Summary                               |
| :------------------- | :------------------------------------ |
| `200 - OK`           | Everything worked as expected.        |
| `401 - Unauthorized` | No valid API key provided.            |
| `403 - Forbidden`    | You cannot access this resource.      |
| `404 - Not Found`    | The requested resource doesn't exist. |

## Errors <a id="errors"></a>

The Request API uses conventional HTTP response codes to indicate the success or failure of an API request. In general: The `200` code indicates a successful request. Codes in the `4xx` range indicate an error that failed given the information provided \(e.g., a required parameter was omitted, authentication issue, etc.\).‌‌

## **Pagination** <a id="pagination"></a>

When fetching multiple Requests you will need to utilize cursor-based pagination via the `skip` and `take` parameters. Both parameters take an integer value and return a list of Requests ordered by the Request ID. The `skip` parameter bypasses a specified number of search results. The `take` parameter specifies the number of search results to return. Both of these parameters are optional, the defaults can be found [here](/portal).‌

As an example, if you wanted to retrieve the first 50 Requests, `skip` would equal 0, and the `take`value would be 50. If you then wanted to retrieve the subsequent 50 Requests `skip` would equal 50, and `take`would equal 50.‌

## Basic Usage <a id="basic-usage"></a>

We assume API_KEY environment variable is set. You can do that with `API_KEY=YOUR-API-KEY`. Don't forget, you can get your API key from your [Request Dashboard](https://dashboard.request.network).‌‌

Here is an example of creating a Request using the API via curl. We are creating a basic BTC request.

```bash
curl -H "Authorization: $API_KEY" \
     -H "Content-Type: application/json" \
     -X POST \
     -d '{"currency": "BTC","expectedAmount": "100000000", "payment": { "type": "bitcoin-testnet", "value": "mqdT2zrDfr6kp69hHLBM8CKLMtRzRbT2o9" }}' \
     https://api.request.network/requests
```

You can then retrieve your Request with this command.

```bash
curl -H "Authorization: $API_KEY" \
     -H "Content-Type: application/json" \
     https://api.request.network/requests/[YOUR_REQUEST_ID]
```

## Examples <a id="examples"></a>

### Creating an Invoice <a id="creating-a-request"></a>

To create an invoice, you must create a basic `Request` object which outlines some information about the Request such as the receiving payment address, which payment network is being used, the currency and the amount expected. You can retrieve individual requests as well as list all requests. Requests are identified by a unique UUID.‌‌

<script src="https://runkit.com/adamdowson/create-a-request/5.0.0"></script>

The `data` object contains a `requestId` field that you can use for other API calls.

### Fetching an Invoice <a id="fetching-a-request"></a>

:::warning Heads up!

If you are an early adopter of this API, please note the temporary `_id` field has been removed and replaced with `requestId`, which is the actual identifier of the Request on the Network. Use this field to fetch a Request, like in the example below.
:::

All invoices have a unique ID, with this ID you can retrieve all the details of an invoice that has previously been created. By supplying the ID that was returned when creating the invoice you can query the endpoint as seen below, the API will then return the corresponding invoice information.‌

<script src="https://runkit.com/adamdowson/find-a-request/5.0.0"></script>
<script src="https://runkit.com/benjlevesque/fetch-a-request"></script>

## **Get Help**

If you would like to get in touch with other developers, and the team that works on this API, you can join our [Slack workspace](https://requesthub.slack.com/join/shared_invite/enQtMjkwNDQwMzUwMjI3LWNlYTlmODViMmE3MzY0MWFiMTUzYmNiMWEyZmNiNWZhMjM3MTEzN2JkZTMxN2FhN2NmODFkNmU5MDBmOTUwMjA) and write in the \#develoment channel.
