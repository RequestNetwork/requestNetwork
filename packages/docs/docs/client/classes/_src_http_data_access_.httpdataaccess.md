---
id: "_src_http_data_access_.httpdataaccess"
title: "HttpDataAccess"
sidebar_label: "HttpDataAccess"
---

[@requestnetwork/request-client.js](../index.md) › [Globals](../globals.md) › ["src/http-data-access"](../modules/_src_http_data_access_.md) › [HttpDataAccess](_src_http_data_access_.httpdataaccess.md)

Exposes a Data-Access module over HTTP

## Hierarchy

* **HttpDataAccess**

  ↳ [HttpMetaMaskDataAccess](_src_http_metamask_data_access_.httpmetamaskdataaccess.md)

## Implements

* IDataAccess

## Index

### Constructors

* [constructor](_src_http_data_access_.httpdataaccess.md#constructor)

### Properties

* [axiosConfig](_src_http_data_access_.httpdataaccess.md#protected-axiosconfig)

### Methods

* [getChannelsByMultipleTopics](_src_http_data_access_.httpdataaccess.md#getchannelsbymultipletopics)
* [getChannelsByTopic](_src_http_data_access_.httpdataaccess.md#getchannelsbytopic)
* [getTransactionsByChannelId](_src_http_data_access_.httpdataaccess.md#gettransactionsbychannelid)
* [initialize](_src_http_data_access_.httpdataaccess.md#initialize)
* [persistTransaction](_src_http_data_access_.httpdataaccess.md#persisttransaction)

## Constructors

###  constructor

\+ **new HttpDataAccess**(`nodeConnectionConfig`: AxiosRequestConfig): *[HttpDataAccess](_src_http_data_access_.httpdataaccess.md)*

*Defined in [request-client.js/src/http-data-access.ts:19](https://github.com/requestNetwork/requestNetwork/blob/15fb307e/packages/request-client.js/src/http-data-access.ts#L19)*

Creates an instance of HttpDataAccess.

**Parameters:**

Name | Type | Default | Description |
------ | ------ | ------ | ------ |
`nodeConnectionConfig` | AxiosRequestConfig | {} | Configuration options to connect to the node. Follows Axios configuration format.  |

**Returns:** *[HttpDataAccess](_src_http_data_access_.httpdataaccess.md)*

## Properties

### `Protected` axiosConfig

• **axiosConfig**: *AxiosRequestConfig*

*Defined in [request-client.js/src/http-data-access.ts:19](https://github.com/requestNetwork/requestNetwork/blob/15fb307e/packages/request-client.js/src/http-data-access.ts#L19)*

Configuration that will be sent to axios for each request.
We can also create a AxiosInstance with axios.create() but it dramatically complicates testing.

## Methods

###  getChannelsByMultipleTopics

▸ **getChannelsByMultipleTopics**(`topics`: string[], `updatedBetween?`: DataAccessTypes.ITimestampBoundaries): *Promise‹IReturnGetChannelsByTopic›*

*Defined in [request-client.js/src/http-data-access.ts:130](https://github.com/requestNetwork/requestNetwork/blob/15fb307e/packages/request-client.js/src/http-data-access.ts#L130)*

Gets all the transactions of channel indexed by multiple topics from the node through HTTP.

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`topics` | string[] | topics to search for |
`updatedBetween?` | DataAccessTypes.ITimestampBoundaries | filter timestamp boundaries  |

**Returns:** *Promise‹IReturnGetChannelsByTopic›*

___

###  getChannelsByTopic

▸ **getChannelsByTopic**(`topic`: string, `updatedBetween?`: DataAccessTypes.ITimestampBoundaries): *Promise‹IReturnGetChannelsByTopic›*

*Defined in [request-client.js/src/http-data-access.ts:103](https://github.com/requestNetwork/requestNetwork/blob/15fb307e/packages/request-client.js/src/http-data-access.ts#L103)*

Gets all the transactions of channel indexed by topic from the node through HTTP.

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`topic` | string | topic to search for |
`updatedBetween?` | DataAccessTypes.ITimestampBoundaries | filter timestamp boundaries  |

**Returns:** *Promise‹IReturnGetChannelsByTopic›*

___

###  getTransactionsByChannelId

▸ **getTransactionsByChannelId**(`channelId`: string, `timestampBoundaries?`: DataAccessTypes.ITimestampBoundaries): *Promise‹IReturnGetTransactions›*

*Defined in [request-client.js/src/http-data-access.ts:76](https://github.com/requestNetwork/requestNetwork/blob/15fb307e/packages/request-client.js/src/http-data-access.ts#L76)*

Gets the transactions for a channel from the node through HTTP.

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`channelId` | string | The channel id to search for |
`timestampBoundaries?` | DataAccessTypes.ITimestampBoundaries | filter timestamp boundaries  |

**Returns:** *Promise‹IReturnGetTransactions›*

___

###  initialize

▸ **initialize**(): *Promise‹void›*

*Defined in [request-client.js/src/http-data-access.ts:39](https://github.com/requestNetwork/requestNetwork/blob/15fb307e/packages/request-client.js/src/http-data-access.ts#L39)*

Initialize the module. Does nothing, exists only to implement IDataAccess

**Returns:** *Promise‹void›*

nothing

___

###  persistTransaction

▸ **persistTransaction**(`transactionData`: ITransaction, `channelId`: string, `topics?`: string[]): *Promise‹IReturnPersistTransaction›*

*Defined in [request-client.js/src/http-data-access.ts:50](https://github.com/requestNetwork/requestNetwork/blob/15fb307e/packages/request-client.js/src/http-data-access.ts#L50)*

Persists a new transaction on a node through HTTP.

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`transactionData` | ITransaction | The transaction data |
`channelId` | string | - |
`topics?` | string[] | The topics used to index the transaction  |

**Returns:** *Promise‹IReturnPersistTransaction›*
