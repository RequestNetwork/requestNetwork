---
id: "_src_api_currency_"
title: "src/api/currency"
sidebar_label: "src/api/currency"
---

[@requestnetwork/request-client.js](../index.md) › [Globals](../globals.md) › ["src/api/currency"](_src_api_currency_.md)

## Index

### Variables

* [currencyList](_src_api_currency_.md#const-currencylist)

### Functions

* [currencyToString](_src_api_currency_.md#currencytostring)
* [getAllSupportedCurrencies](_src_api_currency_.md#getallsupportedcurrencies)
* [getDecimalsForCurrency](_src_api_currency_.md#getdecimalsforcurrency)
* [stringToCurrency](_src_api_currency_.md#stringtocurrency)

## Variables

### `Const` currencyList

• **currencyList**: *Map‹string, object›* = new Map([
  [
    'BTC',
    {
      type: RequestLogicTypes.CURRENCY.BTC,
      value: 'BTC',
    },
  ],

  [
    'ETH',
    {
      type: RequestLogicTypes.CURRENCY.ETH,
      value: 'ETH',
    },
  ],
])

*Defined in [request-client.js/src/api/currency.ts:11](https://github.com/requestNetwork/requestNetwork/blob/15fb307e/packages/request-client.js/src/api/currency.ts#L11)*

## Functions

###  currencyToString

▸ **currencyToString**(`currency`: ICurrency): *string*

*Defined in [request-client.js/src/api/currency.ts:90](https://github.com/requestNetwork/requestNetwork/blob/15fb307e/packages/request-client.js/src/api/currency.ts#L90)*

Converts a Currency object to a readable currency string

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`currency` | ICurrency | The currency object to get the string from |

**Returns:** *string*

The currency string identifier

___

###  getAllSupportedCurrencies

▸ **getAllSupportedCurrencies**(): *object*

*Defined in [request-client.js/src/api/currency.ts:154](https://github.com/requestNetwork/requestNetwork/blob/15fb307e/packages/request-client.js/src/api/currency.ts#L154)*

Returns an object with all the supported currency by type

**Returns:** *object*

List of all supported currencies

* \[ **type**: *string*\]: Array‹object›

___

###  getDecimalsForCurrency

▸ **getDecimalsForCurrency**(`currency`: ICurrency): *number*

*Defined in [request-client.js/src/api/currency.ts:125](https://github.com/requestNetwork/requestNetwork/blob/15fb307e/packages/request-client.js/src/api/currency.ts#L125)*

Returns the number of decimals for a currency

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`currency` | ICurrency | The currency |

**Returns:** *number*

The number of decimals

___

###  stringToCurrency

▸ **stringToCurrency**(`currencyString`: string): *ICurrency*

*Defined in [request-client.js/src/api/currency.ts:37](https://github.com/requestNetwork/requestNetwork/blob/15fb307e/packages/request-client.js/src/api/currency.ts#L37)*

Returns a Currency object from a user-friendly currency string.
The string format is: [CURRENCY_NAME]-[network].
The network is optional.
E.g: BTC, ETH, ETH-rinkeby, SAI, USD, EUR

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`currencyString` | string | The currency string to be formatted  |

**Returns:** *ICurrency*
