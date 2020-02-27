---
id: "_src_mock_data_access_.mockdataaccess"
title: "MockDataAccess"
sidebar_label: "MockDataAccess"
---

[@requestnetwork/request-client.js](../index.md) › [Globals](../globals.md) › ["src/mock-data-access"](../modules/_src_mock_data_access_.md) › [MockDataAccess](_src_mock_data_access_.mockdataaccess.md)

Mock Data access that bypasses the initialization.
This class is meant to be used with HttpRequestNetwork and useMockStorage=true.
Data-access initialization is asynchronous and this class is a hack to avoid having an asynchronous operation in the HttpRequestNetwork constructor.

## Hierarchy

* DataAccess

  ↳ **MockDataAccess**

## Implements

* IDataAccess

## Index

### Constructors

* [constructor](_src_mock_data_access_.mockdataaccess.md#constructor)

### Properties

* [isInitialized](_src_mock_data_access_.mockdataaccess.md#protected-isinitialized)
* [transactionIndex](_src_mock_data_access_.mockdataaccess.md#transactionindex)

### Methods

* [getChannelsByMultipleTopics](_src_mock_data_access_.mockdataaccess.md#getchannelsbymultipletopics)
* [getChannelsByTopic](_src_mock_data_access_.mockdataaccess.md#getchannelsbytopic)
* [getTransactionsByChannelId](_src_mock_data_access_.mockdataaccess.md#gettransactionsbychannelid)
* [initialize](_src_mock_data_access_.mockdataaccess.md#initialize)
* [persistTransaction](_src_mock_data_access_.mockdataaccess.md#persisttransaction)
* [startAutoSynchronization](_src_mock_data_access_.mockdataaccess.md#startautosynchronization)
* [stopAutoSynchronization](_src_mock_data_access_.mockdataaccess.md#stopautosynchronization)
* [synchronizeNewDataIds](_src_mock_data_access_.mockdataaccess.md#synchronizenewdataids)

## Constructors

###  constructor

\+ **new MockDataAccess**(`storage`: IStorage): *[MockDataAccess](_src_mock_data_access_.mockdataaccess.md)*

*Overrides void*

*Defined in [request-client.js/src/mock-data-access.ts:9](https://github.com/requestNetwork/requestNetwork/blob/15fb307e/packages/request-client.js/src/mock-data-access.ts#L9)*

**Parameters:**

Name | Type |
------ | ------ |
`storage` | IStorage |

**Returns:** *[MockDataAccess](_src_mock_data_access_.mockdataaccess.md)*

## Properties

### `Protected` isInitialized

• **isInitialized**: *boolean*

*Inherited from [MockDataAccess](_src_mock_data_access_.mockdataaccess.md).[isInitialized](_src_mock_data_access_.mockdataaccess.md#protected-isinitialized)*

Defined in data-access/dist/data-access.d.ts:25

___

###  transactionIndex

• **transactionIndex**: *ITransactionIndex*

*Inherited from [MockDataAccess](_src_mock_data_access_.mockdataaccess.md).[transactionIndex](_src_mock_data_access_.mockdataaccess.md#transactionindex)*

Defined in data-access/dist/data-access.d.ts:24

## Methods

###  getChannelsByMultipleTopics

▸ **getChannelsByMultipleTopics**(`topics`: string[], `updatedBetween?`: DataAccessTypes.ITimestampBoundaries): *Promise‹IReturnGetChannelsByTopic›*

*Inherited from [MockDataAccess](_src_mock_data_access_.mockdataaccess.md).[getChannelsByMultipleTopics](_src_mock_data_access_.mockdataaccess.md#getchannelsbymultipletopics)*

Defined in data-access/dist/data-access.d.ts:84

Function to get a list of channels indexed by multiple topics

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`topics` | string[] | topics to retrieve the channels from |
`updatedBetween?` | DataAccessTypes.ITimestampBoundaries | filter the channels that have received new data within the time boundaries  |

**Returns:** *Promise‹IReturnGetChannelsByTopic›*

list of channels indexed by topics

___

###  getChannelsByTopic

▸ **getChannelsByTopic**(`topic`: string, `updatedBetween?`: DataAccessTypes.ITimestampBoundaries): *Promise‹IReturnGetChannelsByTopic›*

*Inherited from [MockDataAccess](_src_mock_data_access_.mockdataaccess.md).[getChannelsByTopic](_src_mock_data_access_.mockdataaccess.md#getchannelsbytopic)*

Defined in data-access/dist/data-access.d.ts:75

Function to get a list of channels indexed by topic

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`topic` | string | topic to retrieve the channels from |
`updatedBetween?` | DataAccessTypes.ITimestampBoundaries | filter the channels that have received new data within the time boundaries  |

**Returns:** *Promise‹IReturnGetChannelsByTopic›*

list of channels indexed by topic

___

###  getTransactionsByChannelId

▸ **getTransactionsByChannelId**(`channelId`: string, `timestampBoundaries?`: DataAccessTypes.ITimestampBoundaries): *Promise‹IReturnGetTransactions›*

*Inherited from [MockDataAccess](_src_mock_data_access_.mockdataaccess.md).[getTransactionsByChannelId](_src_mock_data_access_.mockdataaccess.md#gettransactionsbychannelid)*

Defined in data-access/dist/data-access.d.ts:66

Function to get a list of transactions indexed by channel id
if timestampBoundaries is given, the search will be restrict from timestamp 'from' to the timestamp 'to'.
if timestampBoundaries.from is not given, the search will be start from the very start
if timestampBoundaries.to is not given, the search will be stop at the current timestamp

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`channelId` | string | channel id to retrieve the transaction from |
`timestampBoundaries?` | DataAccessTypes.ITimestampBoundaries | timestamp boundaries of the transactions search  |

**Returns:** *Promise‹IReturnGetTransactions›*

list of transactions in the channel

___

###  initialize

▸ **initialize**(): *Promise‹void›*

*Inherited from [MockDataAccess](_src_mock_data_access_.mockdataaccess.md).[initialize](_src_mock_data_access_.mockdataaccess.md#initialize)*

Defined in data-access/dist/data-access.d.ts:43

Function to initialize the dataId topic with the previous block

**Returns:** *Promise‹void›*

___

###  persistTransaction

▸ **persistTransaction**(`transaction`: ITransaction, `channelId`: string, `topics?`: string[]): *Promise‹IReturnPersistTransaction›*

*Inherited from [MockDataAccess](_src_mock_data_access_.mockdataaccess.md).[persistTransaction](_src_mock_data_access_.mockdataaccess.md#persisttransaction)*

Defined in data-access/dist/data-access.d.ts:54

Function to persist transaction and topic in storage
For now, we create a block for each transaction

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`transaction` | ITransaction | transaction to persist |
`channelId` | string | string to identify a bunch of transaction |
`topics?` | string[] | list of string to topic the transaction  |

**Returns:** *Promise‹IReturnPersistTransaction›*

string dataId where the transaction is stored

___

###  startAutoSynchronization

▸ **startAutoSynchronization**(): *void*

*Inherited from [MockDataAccess](_src_mock_data_access_.mockdataaccess.md).[startAutoSynchronization](_src_mock_data_access_.mockdataaccess.md#startautosynchronization)*

Defined in data-access/dist/data-access.d.ts:93

Start to synchronize with the storage automatically
Once called, synchronizeNewDataId function is called periodically

**Returns:** *void*

___

###  stopAutoSynchronization

▸ **stopAutoSynchronization**(): *void*

*Inherited from [MockDataAccess](_src_mock_data_access_.mockdataaccess.md).[stopAutoSynchronization](_src_mock_data_access_.mockdataaccess.md#stopautosynchronization)*

Defined in data-access/dist/data-access.d.ts:97

Stop to synchronize with the storage automatically

**Returns:** *void*

___

###  synchronizeNewDataIds

▸ **synchronizeNewDataIds**(): *Promise‹void›*

*Inherited from [MockDataAccess](_src_mock_data_access_.mockdataaccess.md).[synchronizeNewDataIds](_src_mock_data_access_.mockdataaccess.md#synchronizenewdataids)*

Defined in data-access/dist/data-access.d.ts:88

Function to synchronize with the new dataIds on the storage

**Returns:** *Promise‹void›*
