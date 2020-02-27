---
id: "_src_api_content_data_extension_.contentdataextension"
title: "ContentDataExtension"
sidebar_label: "ContentDataExtension"
---

[@requestnetwork/request-client.js](../index.md) › [Globals](../globals.md) › ["src/api/content-data-extension"](../modules/_src_api_content_data_extension_.md) › [ContentDataExtension](_src_api_content_data_extension_.contentdataextension.md)

Handles the content data of a request

## Hierarchy

* **ContentDataExtension**

## Index

### Constructors

* [constructor](_src_api_content_data_extension_.contentdataextension.md#constructor)

### Properties

* [extension](_src_api_content_data_extension_.contentdataextension.md#private-extension)

### Methods

* [createExtensionsDataForCreation](_src_api_content_data_extension_.contentdataextension.md#createextensionsdataforcreation)
* [getContent](_src_api_content_data_extension_.contentdataextension.md#getcontent)

## Constructors

###  constructor

\+ **new ContentDataExtension**(`advancedLogic`: IAdvancedLogic): *[ContentDataExtension](_src_api_content_data_extension_.contentdataextension.md)*

*Defined in [request-client.js/src/api/content-data-extension.ts:16](https://github.com/requestNetwork/requestNetwork/blob/15fb307e/packages/request-client.js/src/api/content-data-extension.ts#L16)*

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`advancedLogic` | IAdvancedLogic | Instance of the advanced logic layer  |

**Returns:** *[ContentDataExtension](_src_api_content_data_extension_.contentdataextension.md)*

## Properties

### `Private` extension

• **extension**: *IContentData*

*Defined in [request-client.js/src/api/content-data-extension.ts:16](https://github.com/requestNetwork/requestNetwork/blob/15fb307e/packages/request-client.js/src/api/content-data-extension.ts#L16)*

## Methods

###  createExtensionsDataForCreation

▸ **createExtensionsDataForCreation**(`content`: any): *any*

*Defined in [request-client.js/src/api/content-data-extension.ts:31](https://github.com/requestNetwork/requestNetwork/blob/15fb307e/packages/request-client.js/src/api/content-data-extension.ts#L31)*

Creates the extensions data for the creation of this extension

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`content` | any | Content to link to the request |

**Returns:** *any*

ExtensionsData ready to be added to the request

___

###  getContent

▸ **getContent**(`request`: IRequest): *any*

*Defined in [request-client.js/src/api/content-data-extension.ts:52](https://github.com/requestNetwork/requestNetwork/blob/15fb307e/packages/request-client.js/src/api/content-data-extension.ts#L52)*

Gets the content from the extensions state

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`request` | IRequest | The request of which we want the content |

**Returns:** *any*

The content
