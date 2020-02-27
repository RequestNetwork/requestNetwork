---
id: "_src_api_request_.request"
title: "Request"
sidebar_label: "Request"
---

[@requestnetwork/request-client.js](../index.md) › [Globals](../globals.md) › ["src/api/request"](../modules/_src_api_request_.md) › [Request](_src_api_request_.request.md)

Class representing a request.
Instances of this class can be accepted, paid, refunded, etc.
Use the member function `getData` to access the properties of the Request.

Requests should be created with `RequestNetwork.createRequest()`.

## Hierarchy

* **Request**

## Index

### Constructors

* [constructor](_src_api_request_.request.md#constructor)

### Properties

* [balance](_src_api_request_.request.md#private-balance)
* [contentData](_src_api_request_.request.md#private-contentdata)
* [contentDataExtension](_src_api_request_.request.md#private-contentdataextension)
* [paymentNetwork](_src_api_request_.request.md#private-paymentnetwork)
* [pendingData](_src_api_request_.request.md#private-pendingdata)
* [requestData](_src_api_request_.request.md#private-requestdata)
* [requestId](_src_api_request_.request.md#requestid)
* [requestLogic](_src_api_request_.request.md#private-requestlogic)
* [requestMeta](_src_api_request_.request.md#private-requestmeta)

### Methods

* [accept](_src_api_request_.request.md#accept)
* [addPaymentInformation](_src_api_request_.request.md#addpaymentinformation)
* [addRefundInformation](_src_api_request_.request.md#addrefundinformation)
* [cancel](_src_api_request_.request.md#cancel)
* [declareReceivedPayment](_src_api_request_.request.md#declarereceivedpayment)
* [declareReceivedRefund](_src_api_request_.request.md#declarereceivedrefund)
* [declareSentPayment](_src_api_request_.request.md#declaresentpayment)
* [declareSentRefund](_src_api_request_.request.md#declaresentrefund)
* [getData](_src_api_request_.request.md#getdata)
* [increaseExpectedAmountRequest](_src_api_request_.request.md#increaseexpectedamountrequest)
* [reduceExpectedAmountRequest](_src_api_request_.request.md#reduceexpectedamountrequest)
* [refresh](_src_api_request_.request.md#refresh)

## Constructors

###  constructor

\+ **new Request**(`requestLogic`: IRequestLogic, `requestId`: RequestLogicTypes.RequestId, `paymentNetwork?`: IPaymentNetwork | null, `contentDataExtension?`: [ContentDataExtension](_src_api_content_data_extension_.contentdataextension.md) | null): *[Request](_src_api_request_.request.md)*

*Defined in [request-client.js/src/api/request.ts:49](https://github.com/requestNetwork/requestNetwork/blob/15fb307e/packages/request-client.js/src/api/request.ts#L49)*

Creates an instance of Request

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`requestLogic` | IRequestLogic | Instance of the request-logic layer |
`requestId` | RequestLogicTypes.RequestId | ID of the Request |
`paymentNetwork?` | IPaymentNetwork &#124; null | Instance of a payment network to manage the request |
`contentDataExtension?` | [ContentDataExtension](_src_api_content_data_extension_.contentdataextension.md) &#124; null | - |

**Returns:** *[Request](_src_api_request_.request.md)*

## Properties

### `Private` balance

• **balance**: *IBalanceWithEvents | null* = null

*Defined in [request-client.js/src/api/request.ts:49](https://github.com/requestNetwork/requestNetwork/blob/15fb307e/packages/request-client.js/src/api/request.ts#L49)*

Balance and payments/refund events

___

### `Private` contentData

• **contentData**: *any | null* = null

*Defined in [request-client.js/src/api/request.ts:39](https://github.com/requestNetwork/requestNetwork/blob/15fb307e/packages/request-client.js/src/api/request.ts#L39)*

Content data parsed from the extensions data

___

### `Private` contentDataExtension

• **contentDataExtension**: *[ContentDataExtension](_src_api_content_data_extension_.contentdataextension.md) | null*

*Defined in [request-client.js/src/api/request.ts:24](https://github.com/requestNetwork/requestNetwork/blob/15fb307e/packages/request-client.js/src/api/request.ts#L24)*

___

### `Private` paymentNetwork

• **paymentNetwork**: *IPaymentNetwork | null* = null

*Defined in [request-client.js/src/api/request.ts:23](https://github.com/requestNetwork/requestNetwork/blob/15fb307e/packages/request-client.js/src/api/request.ts#L23)*

___

### `Private` pendingData

• **pendingData**: *RequestLogicTypes.IPendingRequest | null* = null

*Defined in [request-client.js/src/api/request.ts:34](https://github.com/requestNetwork/requestNetwork/blob/15fb307e/packages/request-client.js/src/api/request.ts#L34)*

Pending data of the request (see request-logic)

___

### `Private` requestData

• **requestData**: *IRequest | null* = null

*Defined in [request-client.js/src/api/request.ts:29](https://github.com/requestNetwork/requestNetwork/blob/15fb307e/packages/request-client.js/src/api/request.ts#L29)*

Data of the request (see request-logic)

___

###  requestId

• **requestId**: *RequestLogicTypes.RequestId*

*Defined in [request-client.js/src/api/request.ts:20](https://github.com/requestNetwork/requestNetwork/blob/15fb307e/packages/request-client.js/src/api/request.ts#L20)*

Unique ID of the request

___

### `Private` requestLogic

• **requestLogic**: *IRequestLogic*

*Defined in [request-client.js/src/api/request.ts:22](https://github.com/requestNetwork/requestNetwork/blob/15fb307e/packages/request-client.js/src/api/request.ts#L22)*

___

### `Private` requestMeta

• **requestMeta**: *IReturnMeta | null* = null

*Defined in [request-client.js/src/api/request.ts:44](https://github.com/requestNetwork/requestNetwork/blob/15fb307e/packages/request-client.js/src/api/request.ts#L44)*

Meta data of the request (e.g: where the data have been retrieved from)

## Methods

###  accept

▸ **accept**(`signerIdentity`: IIdentity, `refundInformation?`: any): *Promise‹IRequestData›*

*Defined in [request-client.js/src/api/request.ts:78](https://github.com/requestNetwork/requestNetwork/blob/15fb307e/packages/request-client.js/src/api/request.ts#L78)*

Accepts a request

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`signerIdentity` | IIdentity | Identity of the signer. The identity type must be supported by the signature provider. |
`refundInformation?` | any | Refund information to add (any because it is specific to the payment network used by the request) |

**Returns:** *Promise‹IRequestData›*

The updated request

___

###  addPaymentInformation

▸ **addPaymentInformation**(`paymentInformation`: any, `signerIdentity`: IIdentity): *Promise‹IRequestData›*

*Defined in [request-client.js/src/api/request.ts:210](https://github.com/requestNetwork/requestNetwork/blob/15fb307e/packages/request-client.js/src/api/request.ts#L210)*

Adds payment information

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`paymentInformation` | any | Payment information to add (any because it is specific to the payment network used by the request) |
`signerIdentity` | IIdentity | Identity of the signer. The identity type must be supported by the signature provider. |

**Returns:** *Promise‹IRequestData›*

The updated request

___

###  addRefundInformation

▸ **addRefundInformation**(`refundInformation`: any, `signerIdentity`: IIdentity): *Promise‹IRequestData›*

*Defined in [request-client.js/src/api/request.ts:242](https://github.com/requestNetwork/requestNetwork/blob/15fb307e/packages/request-client.js/src/api/request.ts#L242)*

Adds refund information

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`refundInformation` | any | Refund information to add (any because it is specific to the payment network used by the request) |
`signerIdentity` | IIdentity | Identity of the signer. The identity type must be supported by the signature provider. |

**Returns:** *Promise‹IRequestData›*

The updated request

___

###  cancel

▸ **cancel**(`signerIdentity`: IIdentity, `refundInformation?`: any): *Promise‹IRequestData›*

*Defined in [request-client.js/src/api/request.ts:109](https://github.com/requestNetwork/requestNetwork/blob/15fb307e/packages/request-client.js/src/api/request.ts#L109)*

Cancels a request

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`signerIdentity` | IIdentity | Identity of the signer. The identity type must be supported by the signature provider. |
`refundInformation?` | any | refund information to add (any because it is specific to the payment network used by the request) |

**Returns:** *Promise‹IRequestData›*

The updated request

___

###  declareReceivedPayment

▸ **declareReceivedPayment**(`amount`: string, `note`: string, `signerIdentity`: IIdentity): *Promise‹IRequestData›*

*Defined in [request-client.js/src/api/request.ts:362](https://github.com/requestNetwork/requestNetwork/blob/15fb307e/packages/request-client.js/src/api/request.ts#L362)*

Declare a payment is received for the declarative payment network

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`amount` | string | Amount received |
`note` | string | Note from payee about the received payment |
`signerIdentity` | IIdentity | Identity of the signer. The identity type must be supported by the signature provider. |

**Returns:** *Promise‹IRequestData›*

The updated request

___

###  declareReceivedRefund

▸ **declareReceivedRefund**(`amount`: string, `note`: string, `signerIdentity`: IIdentity): *Promise‹IRequestData›*

*Defined in [request-client.js/src/api/request.ts:407](https://github.com/requestNetwork/requestNetwork/blob/15fb307e/packages/request-client.js/src/api/request.ts#L407)*

Declare a refund is received for the declarative payment network

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`amount` | string | Amount received |
`note` | string | Note from payer about the received refund |
`signerIdentity` | IIdentity | Identity of the signer. The identity type must be supported by the signature provider. |

**Returns:** *Promise‹IRequestData›*

The updated request

___

###  declareSentPayment

▸ **declareSentPayment**(`amount`: string, `note`: string, `signerIdentity`: IIdentity): *Promise‹IRequestData›*

*Defined in [request-client.js/src/api/request.ts:275](https://github.com/requestNetwork/requestNetwork/blob/15fb307e/packages/request-client.js/src/api/request.ts#L275)*

Declare a payment is sent for the declarative payment network

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`amount` | string | Amount sent |
`note` | string | Note from payer about the sent payment |
`signerIdentity` | IIdentity | Identity of the signer. The identity type must be supported by the signature provider. |

**Returns:** *Promise‹IRequestData›*

The updated request

___

###  declareSentRefund

▸ **declareSentRefund**(`amount`: string, `note`: string, `signerIdentity`: IIdentity): *Promise‹IRequestData›*

*Defined in [request-client.js/src/api/request.ts:317](https://github.com/requestNetwork/requestNetwork/blob/15fb307e/packages/request-client.js/src/api/request.ts#L317)*

Declare a refund is sent for the declarative payment network

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`amount` | string | Amount sent |
`note` | string | Note from payee about the sent refund |
`signerIdentity` | IIdentity | Identity of the signer. The identity type must be supported by the signature provider. |

**Returns:** *Promise‹IRequestData›*

The updated request

___

###  getData

▸ **getData**(): *IRequestData*

*Defined in [request-client.js/src/api/request.ts:449](https://github.com/requestNetwork/requestNetwork/blob/15fb307e/packages/request-client.js/src/api/request.ts#L449)*

Gets the request data

**Returns:** *IRequestData*

The updated request data

___

###  increaseExpectedAmountRequest

▸ **increaseExpectedAmountRequest**(`deltaAmount`: RequestLogicTypes.Amount, `signerIdentity`: IIdentity, `refundInformation?`: any): *Promise‹IRequestData›*

*Defined in [request-client.js/src/api/request.ts:142](https://github.com/requestNetwork/requestNetwork/blob/15fb307e/packages/request-client.js/src/api/request.ts#L142)*

Increases the expected amount of the request.

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`deltaAmount` | RequestLogicTypes.Amount | Amount by which to increase the expected amount |
`signerIdentity` | IIdentity | Identity of the signer. The identity type must be supported by the signature provider. |
`refundInformation?` | any | Refund information to add (any because it is specific to the payment network used by the request) |

**Returns:** *Promise‹IRequestData›*

The updated request

___

###  reduceExpectedAmountRequest

▸ **reduceExpectedAmountRequest**(`deltaAmount`: RequestLogicTypes.Amount, `signerIdentity`: IIdentity, `paymentInformation?`: any): *Promise‹IRequestData›*

*Defined in [request-client.js/src/api/request.ts:176](https://github.com/requestNetwork/requestNetwork/blob/15fb307e/packages/request-client.js/src/api/request.ts#L176)*

Reduces the expected amount of the request. This can be called by the payee e.g. to apply discounts or special offers.

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`deltaAmount` | RequestLogicTypes.Amount | Amount by which to reduce the expected amount |
`signerIdentity` | IIdentity | Identity of the signer. The identity type must be supported by the signature provider. |
`paymentInformation?` | any | Payment information to add (any because it is specific to the payment network used by the request) |

**Returns:** *Promise‹IRequestData›*

The updated request

___

###  refresh

▸ **refresh**(`requestAndMeta?`: RequestLogicTypes.IReturnGetRequestFromId): *Promise‹IRequestData›*

*Defined in [request-client.js/src/api/request.ts:476](https://github.com/requestNetwork/requestNetwork/blob/15fb307e/packages/request-client.js/src/api/request.ts#L476)*

Refresh the request data and balance from the network (check if new events happened - e.g: accept, payments etc..) and return these data

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`requestAndMeta?` | RequestLogicTypes.IReturnGetRequestFromId | return from getRequestFromId to avoid asking twice |

**Returns:** *Promise‹IRequestData›*

Refreshed request data
