---
id: "_src_http_metamask_data_access_.httpmetamaskdataaccess"
title: "HttpMetaMaskDataAccess"
sidebar_label: "HttpMetaMaskDataAccess"
---

[@requestnetwork/request-client.js](../index.md) › [Globals](../globals.md) › ["src/http-metamask-data-access"](../modules/_src_http_metamask_data_access_.md) › [HttpMetaMaskDataAccess](_src_http_metamask_data_access_.httpmetamaskdataaccess.md)

Exposes a Data-Access module over HTTP

## Hierarchy

* [HttpDataAccess](_src_http_data_access_.httpdataaccess.md)

  ↳ **HttpMetaMaskDataAccess**

## Implements

* IDataAccess

## Index

### Constructors

* [constructor](_src_http_metamask_data_access_.httpmetamaskdataaccess.md#constructor)

### Properties

* [axiosConfig](_src_http_metamask_data_access_.httpmetamaskdataaccess.md#protected-axiosconfig)
* [cache](_src_http_metamask_data_access_.httpmetamaskdataaccess.md#cache)
* [networkName](_src_http_metamask_data_access_.httpmetamaskdataaccess.md#private-networkname)
* [provider](_src_http_metamask_data_access_.httpmetamaskdataaccess.md#private-provider)
* [submitterContract](_src_http_metamask_data_access_.httpmetamaskdataaccess.md#private-submittercontract)

### Methods

* [getCachedTransactionsAndCleanCache](_src_http_metamask_data_access_.httpmetamaskdataaccess.md#getcachedtransactionsandcleancache)
* [getChannelsByMultipleTopics](_src_http_metamask_data_access_.httpmetamaskdataaccess.md#getchannelsbymultipletopics)
* [getChannelsByTopic](_src_http_metamask_data_access_.httpmetamaskdataaccess.md#getchannelsbytopic)
* [getTransactionsByChannelId](_src_http_metamask_data_access_.httpmetamaskdataaccess.md#gettransactionsbychannelid)
* [initialize](_src_http_metamask_data_access_.httpmetamaskdataaccess.md#initialize)
* [persistTransaction](_src_http_metamask_data_access_.httpmetamaskdataaccess.md#persisttransaction)

## Constructors

###  constructor

\+ **new HttpMetaMaskDataAccess**(`__namedParameters`: object): *[HttpMetaMaskDataAccess](_src_http_metamask_data_access_.httpmetamaskdataaccess.md)*

*Overrides [HttpDataAccess](_src_http_data_access_.httpdataaccess.md).[constructor](_src_http_data_access_.httpdataaccess.md#constructor)*

*Defined in [request-client.js/src/http-metamask-data-access.ts:31](https://github.com/requestNetwork/requestNetwork/blob/15fb307e/packages/request-client.js/src/http-metamask-data-access.ts#L31)*

Creates an instance of HttpDataAccess.

**Parameters:**

▪`Default value`  **__namedParameters**: *object*= {
      nodeConnectionConfig: {},
    }

Name | Type | Description |
------ | ------ | ------ |
`ethereumProviderUrl` | undefined &#124; string | - |
`nodeConnectionConfig` | undefined &#124; AxiosRequestConfig | Configuration options to connect to the node. Follows Axios configuration format.  |
`web3` | any | - |

**Returns:** *[HttpMetaMaskDataAccess](_src_http_metamask_data_access_.httpmetamaskdataaccess.md)*

## Properties

### `Protected` axiosConfig

• **axiosConfig**: *AxiosRequestConfig*

*Inherited from [HttpDataAccess](_src_http_data_access_.httpdataaccess.md).[axiosConfig](_src_http_data_access_.httpdataaccess.md#protected-axiosconfig)*

*Defined in [request-client.js/src/http-data-access.ts:19](https://github.com/requestNetwork/requestNetwork/blob/15fb307e/packages/request-client.js/src/http-data-access.ts#L19)*

Configuration that will be sent to axios for each request.
We can also create a AxiosInstance with axios.create() but it dramatically complicates testing.

___

###  cache

• **cache**: *object*

*Defined in [request-client.js/src/http-metamask-data-access.ts:23](https://github.com/requestNetwork/requestNetwork/blob/15fb307e/packages/request-client.js/src/http-metamask-data-access.ts#L23)*

Cache block persisted directly (in case the node did not have the time to retrieve it)
(public for easier testing)

#### Type declaration:

* \[ **channelId**: *string*\]: object

* \[ **ipfsHash**: *string*\]: object | null

___

### `Private` networkName

• **networkName**: *string* = ""

*Defined in [request-client.js/src/http-metamask-data-access.ts:31](https://github.com/requestNetwork/requestNetwork/blob/15fb307e/packages/request-client.js/src/http-metamask-data-access.ts#L31)*

___

### `Private` provider

• **provider**: *JsonRpcProvider | Web3Provider*

*Defined in [request-client.js/src/http-metamask-data-access.ts:30](https://github.com/requestNetwork/requestNetwork/blob/15fb307e/packages/request-client.js/src/http-metamask-data-access.ts#L30)*

___

### `Private` submitterContract

• **submitterContract**: *Contract | undefined*

*Defined in [request-client.js/src/http-metamask-data-access.ts:29](https://github.com/requestNetwork/requestNetwork/blob/15fb307e/packages/request-client.js/src/http-metamask-data-access.ts#L29)*

## Methods

###  getCachedTransactionsAndCleanCache

▸ **getCachedTransactionsAndCleanCache**(`channelId`: string, `storageLocationFromNode`: string[], `timestampBoundaries?`: DataAccessTypes.ITimestampBoundaries): *IReturnGetTransactions*

*Defined in [request-client.js/src/http-metamask-data-access.ts:202](https://github.com/requestNetwork/requestNetwork/blob/15fb307e/packages/request-client.js/src/http-metamask-data-access.ts#L202)*

Gets the cached transactions and remove the ones that have been retrieved from the node
(public for easier testing)

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`channelId` | string | The channel id to search for |
`storageLocationFromNode` | string[] | location retrieved from the node |
`timestampBoundaries?` | DataAccessTypes.ITimestampBoundaries | filter timestamp boundaries  |

**Returns:** *IReturnGetTransactions*

___

###  getChannelsByMultipleTopics

▸ **getChannelsByMultipleTopics**(`topics`: string[], `updatedBetween?`: DataAccessTypes.ITimestampBoundaries): *Promise‹IReturnGetChannelsByTopic›*

*Inherited from [HttpDataAccess](_src_http_data_access_.httpdataaccess.md).[getChannelsByMultipleTopics](_src_http_data_access_.httpdataaccess.md#getchannelsbymultipletopics)*

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

*Inherited from [HttpDataAccess](_src_http_data_access_.httpdataaccess.md).[getChannelsByTopic](_src_http_data_access_.httpdataaccess.md#getchannelsbytopic)*

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

*Overrides [HttpDataAccess](_src_http_data_access_.httpdataaccess.md).[getTransactionsByChannelId](_src_http_data_access_.httpdataaccess.md#gettransactionsbychannelid)*

*Defined in [request-client.js/src/http-metamask-data-access.ts:155](https://github.com/requestNetwork/requestNetwork/blob/15fb307e/packages/request-client.js/src/http-metamask-data-access.ts#L155)*

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

*Overrides [HttpDataAccess](_src_http_data_access_.httpdataaccess.md).[initialize](_src_http_data_access_.httpdataaccess.md#initialize)*

*Defined in [request-client.js/src/http-metamask-data-access.ts:65](https://github.com/requestNetwork/requestNetwork/blob/15fb307e/packages/request-client.js/src/http-metamask-data-access.ts#L65)*

Initialize the module. Does nothing, exists only to implement IDataAccess

**Returns:** *Promise‹void›*

nothing

___

###  persistTransaction

▸ **persistTransaction**(`transactionData`: ITransaction, `channelId`: string, `topics?`: string[]): *Promise‹IReturnPersistTransaction›*

*Overrides [HttpDataAccess](_src_http_data_access_.httpdataaccess.md).[persistTransaction](_src_http_data_access_.httpdataaccess.md#persisttransaction)*

*Defined in [request-client.js/src/http-metamask-data-access.ts:76](https://github.com/requestNetwork/requestNetwork/blob/15fb307e/packages/request-client.js/src/http-metamask-data-access.ts#L76)*

Persists a new transaction using the node only for IPFS but persisting on ethereum through local provider

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`transactionData` | ITransaction | The transaction data |
`channelId` | string | - |
`topics?` | string[] | The topics used to index the transaction  |

**Returns:** *Promise‹IReturnPersistTransaction›*
