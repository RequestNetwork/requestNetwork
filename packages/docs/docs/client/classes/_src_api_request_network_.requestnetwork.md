---
id: "_src_api_request_network_.requestnetwork"
title: "RequestNetwork"
sidebar_label: "RequestNetwork"
---

[@requestnetwork/request-client.js](../index.md) › [Globals](../globals.md) › ["src/api/request-network"](../modules/_src_api_request_network_.md) › [RequestNetwork](_src_api_request_network_.requestnetwork.md)

Entry point of the request-client.js library. Create requests, get requests, manipulate requests.

## Hierarchy

* **RequestNetwork**

  ↳ [HttpRequestNetwork](_src_http_request_network_.httprequestnetwork.md)

## Index

### Constructors

* [constructor](_src_api_request_network_.requestnetwork.md#constructor)

### Properties

* [advancedLogic](_src_api_request_network_.requestnetwork.md#private-advancedlogic)
* [bitcoinDetectionProvider](_src_api_request_network_.requestnetwork.md#optional-bitcoindetectionprovider)
* [contentData](_src_api_request_network_.requestnetwork.md#private-contentdata)
* [requestLogic](_src_api_request_network_.requestnetwork.md#private-requestlogic)
* [transaction](_src_api_request_network_.requestnetwork.md#private-transaction)

### Methods

* [_createEncryptedRequest](_src_api_request_network_.requestnetwork.md#_createencryptedrequest)
* [computeRequestId](_src_api_request_network_.requestnetwork.md#computerequestid)
* [createRequest](_src_api_request_network_.requestnetwork.md#createrequest)
* [fromIdentity](_src_api_request_network_.requestnetwork.md#fromidentity)
* [fromMultipleIdentities](_src_api_request_network_.requestnetwork.md#frommultipleidentities)
* [fromMultipleTopics](_src_api_request_network_.requestnetwork.md#frommultipletopics)
* [fromRequestId](_src_api_request_network_.requestnetwork.md#fromrequestid)
* [fromTopic](_src_api_request_network_.requestnetwork.md#fromtopic)
* [prepareRequestParameters](_src_api_request_network_.requestnetwork.md#private-preparerequestparameters)

## Constructors

###  constructor

\+ **new RequestNetwork**(`dataAccess`: IDataAccess, `signatureProvider?`: SignatureProviderTypes.ISignatureProvider, `decryptionProvider?`: DecryptionProviderTypes.IDecryptionProvider, `bitcoinDetectionProvider?`: PaymentTypes.IBitcoinDetectionProvider): *[RequestNetwork](_src_api_request_network_.requestnetwork.md)*

*Defined in [request-client.js/src/api/request-network.ts:34](https://github.com/requestNetwork/requestNetwork/blob/15fb307e/packages/request-client.js/src/api/request-network.ts#L34)*

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`dataAccess` | IDataAccess | instance of data-access layer |
`signatureProvider?` | SignatureProviderTypes.ISignatureProvider | module in charge of the signatures |
`decryptionProvider?` | DecryptionProviderTypes.IDecryptionProvider | module in charge of the decryption |
`bitcoinDetectionProvider?` | PaymentTypes.IBitcoinDetectionProvider | bitcoin detection provider  |

**Returns:** *[RequestNetwork](_src_api_request_network_.requestnetwork.md)*

## Properties

### `Private` advancedLogic

• **advancedLogic**: *IAdvancedLogic*

*Defined in [request-client.js/src/api/request-network.ts:32](https://github.com/requestNetwork/requestNetwork/blob/15fb307e/packages/request-client.js/src/api/request-network.ts#L32)*

___

### `Optional` bitcoinDetectionProvider

• **bitcoinDetectionProvider**? : *PaymentTypes.IBitcoinDetectionProvider*

*Defined in [request-client.js/src/api/request-network.ts:28](https://github.com/requestNetwork/requestNetwork/blob/15fb307e/packages/request-client.js/src/api/request-network.ts#L28)*

___

### `Private` contentData

• **contentData**: *[ContentDataExtension](_src_api_content_data_extension_.contentdataextension.md)*

*Defined in [request-client.js/src/api/request-network.ts:34](https://github.com/requestNetwork/requestNetwork/blob/15fb307e/packages/request-client.js/src/api/request-network.ts#L34)*

___

### `Private` requestLogic

• **requestLogic**: *IRequestLogic*

*Defined in [request-client.js/src/api/request-network.ts:30](https://github.com/requestNetwork/requestNetwork/blob/15fb307e/packages/request-client.js/src/api/request-network.ts#L30)*

___

### `Private` transaction

• **transaction**: *ITransactionManager*

*Defined in [request-client.js/src/api/request-network.ts:31](https://github.com/requestNetwork/requestNetwork/blob/15fb307e/packages/request-client.js/src/api/request-network.ts#L31)*

## Methods

###  _createEncryptedRequest

▸ **_createEncryptedRequest**(`parameters`: ICreateRequestParameters, `encryptionParams`: IEncryptionParameters[]): *Promise‹[Request](_src_api_request_.request.md)›*

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

*Defined in [request-client.js/src/api/request-network.ts:207](https://github.com/requestNetwork/requestNetwork/blob/15fb307e/packages/request-client.js/src/api/request-network.ts#L207)*

Create an array of request instances from a topic

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`topic` | any | - |
`updatedBetween?` | Types.ITimestampBoundaries | filter the requests with time boundaries |

**Returns:** *Promise‹[Request](_src_api_request_.request.md)[]›*

the Requests

___

### `Private` prepareRequestParameters

▸ **prepareRequestParameters**(`parameters`: ICreateRequestParameters): *Promise‹object›*

*Defined in [request-client.js/src/api/request-network.ts:312](https://github.com/requestNetwork/requestNetwork/blob/15fb307e/packages/request-client.js/src/api/request-network.ts#L312)*

A helper to validate and prepare the parameters of a request.

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`parameters` | ICreateRequestParameters | Parameters to create a request |

**Returns:** *Promise‹object›*

the parameters, ready for request creation, the topics, and the paymentNetwork
