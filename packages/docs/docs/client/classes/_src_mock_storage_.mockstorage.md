---
id: "_src_mock_storage_.mockstorage"
title: "MockStorage"
sidebar_label: "MockStorage"
---

[@requestnetwork/request-client.js](../index.md) › [Globals](../globals.md) › ["src/mock-storage"](../modules/_src_mock_storage_.md) › [MockStorage](_src_mock_storage_.mockstorage.md)

Storage layer implemented with in-memory hashmap, to be used for testing.

## Hierarchy

* **MockStorage**

## Implements

* IStorage

## Index

### Properties

* [data](_src_mock_storage_.mockstorage.md#private-data)

### Methods

* [_ipfsAdd](_src_mock_storage_.mockstorage.md#_ipfsadd)
* [append](_src_mock_storage_.mockstorage.md#append)
* [getData](_src_mock_storage_.mockstorage.md#getdata)
* [initialize](_src_mock_storage_.mockstorage.md#initialize)
* [read](_src_mock_storage_.mockstorage.md#read)
* [readMany](_src_mock_storage_.mockstorage.md#readmany)

## Properties

### `Private` data

• **data**: *object*

*Defined in [request-client.js/src/mock-storage.ts:10](https://github.com/requestNetwork/requestNetwork/blob/15fb307e/packages/request-client.js/src/mock-storage.ts#L10)*

#### Type declaration:

* \[ **key**: *string*\]: object

* **content**: *string*

* **state**: *ContentState*

* **timestamp**: *number*

## Methods

###  _ipfsAdd

▸ **_ipfsAdd**(`content`: string): *Promise‹IIpfsMeta›*

*Defined in [request-client.js/src/mock-storage.ts:18](https://github.com/requestNetwork/requestNetwork/blob/15fb307e/packages/request-client.js/src/mock-storage.ts#L18)*

**Parameters:**

Name | Type |
------ | ------ |
`content` | string |

**Returns:** *Promise‹IIpfsMeta›*

___

###  append

▸ **append**(`content`: string): *Promise‹IAppendResult›*

*Defined in [request-client.js/src/mock-storage.ts:38](https://github.com/requestNetwork/requestNetwork/blob/15fb307e/packages/request-client.js/src/mock-storage.ts#L38)*

**Parameters:**

Name | Type |
------ | ------ |
`content` | string |

**Returns:** *Promise‹IAppendResult›*

___

###  getData

▸ **getData**(): *Promise‹IEntriesWithLastTimestamp›*

*Defined in [request-client.js/src/mock-storage.ts:92](https://github.com/requestNetwork/requestNetwork/blob/15fb307e/packages/request-client.js/src/mock-storage.ts#L92)*

**Returns:** *Promise‹IEntriesWithLastTimestamp›*

___

###  initialize

▸ **initialize**(): *Promise‹void›*

*Defined in [request-client.js/src/mock-storage.ts:14](https://github.com/requestNetwork/requestNetwork/blob/15fb307e/packages/request-client.js/src/mock-storage.ts#L14)*

**Returns:** *Promise‹void›*

___

###  read

▸ **read**(`id`: string): *Promise‹IEntry›*

*Defined in [request-client.js/src/mock-storage.ts:73](https://github.com/requestNetwork/requestNetwork/blob/15fb307e/packages/request-client.js/src/mock-storage.ts#L73)*

**Parameters:**

Name | Type |
------ | ------ |
`id` | string |

**Returns:** *Promise‹IEntry›*

___

###  readMany

▸ **readMany**(`ids`: string[]): *Promise‹IEntry[]›*

*Defined in [request-client.js/src/mock-storage.ts:88](https://github.com/requestNetwork/requestNetwork/blob/15fb307e/packages/request-client.js/src/mock-storage.ts#L88)*

**Parameters:**

Name | Type |
------ | ------ |
`ids` | string[] |

**Returns:** *Promise‹IEntry[]›*
