---
id: "_src_http_request_network_.httprequestnetwork"
title: "HttpRequestNetwork"
sidebar_label: "HttpRequestNetwork"
---

[@requestnetwork/request-client.js](../index.md) › [Globals](../globals.md) › ["src/http-request-network"](../modules/_src_http_request_network_.md) › [HttpRequestNetwork](_src_http_request_network_.httprequestnetwork.md)

Exposes RequestNetwork module configured to use http-data-access.

## Hierarchy

* [RequestNetwork](_src_api_request_network_.requestnetwork.md)

  ↳ **HttpRequestNetwork**

## Index

### Constructors

* [constructor](_src_http_request_network_.httprequestnetwork.md#constructor)

### Properties

* [bitcoinDetectionProvider](_src_http_request_network_.httprequestnetwork.md#optional-bitcoindetectionprovider)

### Methods

* [_createEncryptedRequest](_src_http_request_network_.httprequestnetwork.md#_createencryptedrequest)
* [computeRequestId](_src_http_request_network_.httprequestnetwork.md#computerequestid)
* [createRequest](_src_http_request_network_.httprequestnetwork.md#createrequest)
* [fromIdentity](_src_http_request_network_.httprequestnetwork.md#fromidentity)
* [fromMultipleIdentities](_src_http_request_network_.httprequestnetwork.md#frommultipleidentities)
* [fromMultipleTopics](_src_http_request_network_.httprequestnetwork.md#frommultipletopics)
* [fromRequestId](_src_http_request_network_.httprequestnetwork.md#fromrequestid)
* [fromTopic](_src_http_request_network_.httprequestnetwork.md#fromtopic)

## Constructors

###  constructor

\+ **new HttpRequestNetwork**(`__namedParameters`: object): *[HttpRequestNetwork](_src_http_request_network_.httprequestnetwork.md)*

*Overrides [RequestNetwork](_src_api_request_network_.requestnetwork.md).[constructor](_src_api_request_network_.requestnetwork.md#constructor)*

*Defined in [request-client.js/src/http-request-network.ts:16](https://github.com/requestNetwork/requestNetwork/blob/15fb307e/packages/request-client.js/src/http-request-network.ts#L16)*

Creates an instance of HttpRequestNetwork.

**Parameters:**

▪`Default value`  **__namedParameters**: *object*= {
      nodeConnectionConfig: {},
      useLocalEthereumBroadcast: false,
      useMockStorage: false,
    }

Name | Type |
------ | ------ |
`decryptionProvider` | undefined &#124; IDecryptionProvider |
`ethereumProviderUrl` | undefined &#124; string |
`nodeConnectionConfig` | undefined &#124; AxiosRequestConfig |
`signatureProvider` | undefined &#124; ISignatureProvider |
`useLocalEthereumBroadcast` | undefined &#124; false &#124; true |
`useMockStorage` | undefined &#124; false &#124; true |
`web3` | any |

**Returns:** *[HttpRequestNetwork](_src_http_request_network_.httprequestnetwork.md)*

## Properties

### `Optional` bitcoinDetectionProvider

• **bitcoinDetectionProvider**? : *PaymentTypes.IBitcoinDetectionProvider*

*Inherited from [RequestNetwork](_src_api_request_network_.requestnetwork.md).[bitcoinDetectionProvider](_src_api_request_network_.requestnetwork.md#optional-bitcoindetectionprovider)*

*Defined in [request-client.js/src/api/request-network.ts:28](https://github.com/requestNetwork/requestNetwork/blob/15fb307e/packages/request-client.js/src/api/request-network.ts#L28)*

## Methods

###  _createEncryptedRequest

▸ **_createEncryptedRequest**(`parameters`: ICreateRequestParameters, `encryptionParams`: IEncryptionParameters[]): *Promise‹[Request](_src_api_request_.request.md)›*

*Inherited from [RequestNetwork](_src_api_request_network_.requestnetwork.md).[_createEncryptedRequest](_src_api_request_network_.requestnetwork.md#_createencryptedrequest)*

*Defined in [request-client.js/src/api/request-network.ts:85](https://github.com/requestNetwork/requestNetwork/blob/15fb307e/packages/request-client.js/src/api/request-network.ts#L85)*

Creates an encrypted request.

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`parameters` | ICreateRequestParameters | Parameters to create a request |
`encryptionParams` | IEncryptionParameters[] | Request encryption parameters |

**Returns:** *Promise‹[Request](_src_api_request_.request.md)›*

The created encrypted request

___

###  computeRequestId

▸ **computeRequestId**(`parameters`: ICreateRequestParameters): *Promise‹RequestLogicTypes.RequestId›*

*Inherited from [RequestNetwork](_src_api_request_network_.requestnetwork.md).[computeRequestId](_src_api_request_network_.requestnetwork.md#computerequestid)*

*Defined in [request-client.js/src/api/request-network.ts:117](https://github.com/requestNetwork/requestNetwork/blob/15fb307e/packages/request-client.js/src/api/request-network.ts#L117)*

Gets the ID of a request without creating it.

**Parameters:**

Name | Type |
------ | ------ |
`parameters` | ICreateRequestParameters |

**Returns:** *Promise‹RequestLogicTypes.RequestId›*

The requestId

___

###  createRequest

▸ **createRequest**(`parameters`: ICreateRequestParameters): *Promise‹[Request](_src_api_request_.request.md)›*

*Inherited from [RequestNetwork](_src_api_request_network_.requestnetwork.md).[createRequest](_src_api_request_network_.requestnetwork.md#createrequest)*

*Defined in [request-client.js/src/api/request-network.ts:61](https://github.com/requestNetwork/requestNetwork/blob/15fb307e/packages/request-client.js/src/api/request-network.ts#L61)*

Creates a request.

**Parameters:**

Name | Type |
------ | ------ |
`parameters` | ICreateRequestParameters |

**Returns:** *Promise‹[Request](_src_api_request_.request.md)›*

The created request

___

###  fromIdentity

▸ **fromIdentity**(`identity`: IIdentity, `updatedBetween?`: Types.ITimestampBoundaries): *Promise‹[Request](_src_api_request_.request.md)[]›*

*Inherited from [RequestNetwork](_src_api_request_network_.requestnetwork.md).[fromIdentity](_src_api_request_network_.requestnetwork.md#fromidentity)*

*Defined in [request-client.js/src/api/request-network.ts:168](https://github.com/requestNetwork/requestNetwork/blob/15fb307e/packages/request-client.js/src/api/request-network.ts#L168)*

Create an array of request instances from an identity

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`identity` | IIdentity | - |
`updatedBetween?` | Types.ITimestampBoundaries | filter the requests with time boundaries |

**Returns:** *Promise‹[Request](_src_api_request_.request.md)[]›*

the Requests

___

###  fromMultipleIdentities

▸ **fromMultipleIdentities**(`identities`: IIdentity[], `updatedBetween?`: Types.ITimestampBoundaries): *Promise‹[Request](_src_api_request_.request.md)[]›*

*Inherited from [RequestNetwork](_src_api_request_network_.requestnetwork.md).[fromMultipleIdentities](_src_api_request_network_.requestnetwork.md#frommultipleidentities)*

*Defined in [request-client.js/src/api/request-network.ts:185](https://github.com/requestNetwork/requestNetwork/blob/15fb307e/packages/request-client.js/src/api/request-network.ts#L185)*

Create an array of request instances from multiple identities

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`identities` | IIdentity[] | - |
`updatedBetween?` | Types.ITimestampBoundaries | filter the requests with time boundaries |

**Returns:** *Promise‹[Request](_src_api_request_.request.md)[]›*

the requests

___

###  fromMultipleTopics

▸ **fromMultipleTopics**(`topics`: any[], `updatedBetween?`: Types.ITimestampBoundaries): *Promise‹[Request](_src_api_request_.request.md)[]›*

*Inherited from [RequestNetwork](_src_api_request_network_.requestnetwork.md).[fromMultipleTopics](_src_api_request_network_.requestnetwork.md#frommultipletopics)*

*Defined in [request-client.js/src/api/request-network.ts:260](https://github.com/requestNetwork/requestNetwork/blob/15fb307e/packages/request-client.js/src/api/request-network.ts#L260)*

Create an array of request instances from a multiple topics

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`topics` | any[] | - |
`updatedBetween?` | Types.ITimestampBoundaries | filter the requests with time boundaries |

**Returns:** *Promise‹[Request](_src_api_request_.request.md)[]›*

the Requests

___

###  fromRequestId

▸ **fromRequestId**(`requestId`: RequestLogicTypes.RequestId): *Promise‹[Request](_src_api_request_.request.md)›*

*Inherited from [RequestNetwork](_src_api_request_network_.requestnetwork.md).[fromRequestId](_src_api_request_network_.requestnetwork.md#fromrequestid)*

*Defined in [request-client.js/src/api/request-network.ts:130](https://github.com/requestNetwork/requestNetwork/blob/15fb307e/packages/request-client.js/src/api/request-network.ts#L130)*

Create a Request instance from an existing Request's ID

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`requestId` | RequestLogicTypes.RequestId | The ID of the Request |

**Returns:** *Promise‹[Request](_src_api_request_.request.md)›*

the Request

___

###  fromTopic

▸ **fromTopic**(`topic`: any, `updatedBetween?`: Types.ITimestampBoundaries): *Promise‹[Request](_src_api_request_.request.md)[]›*

*Inherited from [RequestNetwork](_src_api_request_network_.requestnetwork.md).[fromTopic](_src_api_request_network_.requestnetwork.md#fromtopic)*

*Defined in [request-client.js/src/api/request-network.ts:207](https://github.com/requestNetwork/requestNetwork/blob/15fb307e/packages/request-client.js/src/api/request-network.ts#L207)*

Create an array of request instances from a topic

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`topic` | any | - |
`updatedBetween?` | Types.ITimestampBoundaries | filter the requests with time boundaries |

**Returns:** *Promise‹[Request](_src_api_request_.request.md)[]›*

the Requests
