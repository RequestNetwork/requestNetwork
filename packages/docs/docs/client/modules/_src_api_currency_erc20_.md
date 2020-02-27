---
id: "_src_api_currency_erc20_"
title: "src/api/currency/erc20"
sidebar_label: "src/api/currency/erc20"
---

[@requestnetwork/request-client.js](../index.md) › [Globals](../globals.md) › ["src/api/currency/erc20"](_src_api_currency_erc20_.md)

## Index

### Interfaces

* [ITokenDescription](../interfaces/_src_api_currency_erc20_.itokendescription.md)
* [ITokenMap](../interfaces/_src_api_currency_erc20_.itokenmap.md)

### Variables

* [supportedERC20Tokens](_src_api_currency_erc20_.md#const-supportederc20tokens)
* [supportedRinkebyERC20](_src_api_currency_erc20_.md#const-supportedrinkebyerc20)

### Functions

* [getErc20Currency](_src_api_currency_erc20_.md#geterc20currency)
* [getErc20Decimals](_src_api_currency_erc20_.md#geterc20decimals)
* [getErc20FromSymbol](_src_api_currency_erc20_.md#geterc20fromsymbol)
* [getErc20Symbol](_src_api_currency_erc20_.md#geterc20symbol)
* [getMainnetErc20FromAddress](_src_api_currency_erc20_.md#getmainneterc20fromaddress)
* [getSupportedERC20Tokens](_src_api_currency_erc20_.md#getsupportederc20tokens)
* [validERC20Address](_src_api_currency_erc20_.md#validerc20address)

### Object literals

* [supportedRinkebyERC20Details](_src_api_currency_erc20_.md#const-supportedrinkebyerc20details)

## Variables

### `Const` supportedERC20Tokens

• **supportedERC20Tokens**: *[ITokenMap](../interfaces/_src_api_currency_erc20_.itokenmap.md)* = require('eth-contract-metadata') as ITokenMap

*Defined in [request-client.js/src/api/currency/erc20.ts:20](https://github.com/requestNetwork/requestNetwork/blob/15fb307e/packages/request-client.js/src/api/currency/erc20.ts#L20)*

___

### `Const` supportedRinkebyERC20

• **supportedRinkebyERC20**: *Map‹string, object›* = new Map([
  // Request Central Bank token, used for testing on rinkeby.
  [
    'CTBK',
    {
      network: 'rinkeby',
      type: RequestLogicTypes.CURRENCY.ERC20,
      value: '0x995d6a8c21f24be1dd04e105dd0d83758343e258',
    },
  ],

  // Faucet Token on rinkeby network. Easy to use on tests.
  [
    'FAU',
    {
      network: 'rinkeby',
      type: RequestLogicTypes.CURRENCY.ERC20,
      value: '0xFab46E002BbF0b4509813474841E0716E6730136',
    },
  ],
])

*Defined in [request-client.js/src/api/currency/erc20.ts:23](https://github.com/requestNetwork/requestNetwork/blob/15fb307e/packages/request-client.js/src/api/currency/erc20.ts#L23)*

## Functions

###  getErc20Currency

▸ **getErc20Currency**(`symbol`: string, `network`: string): *ICurrency | undefined*

*Defined in [request-client.js/src/api/currency/erc20.ts:68](https://github.com/requestNetwork/requestNetwork/blob/15fb307e/packages/request-client.js/src/api/currency/erc20.ts#L68)*

Returns a Currency object for an ERC20, if found

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`symbol` | string | The ERC20 token symbol |
`network` | string | The ERC20 contract network  |

**Returns:** *ICurrency | undefined*

___

###  getErc20Decimals

▸ **getErc20Decimals**(`currency`: ICurrency): *number*

*Defined in [request-client.js/src/api/currency/erc20.ts:101](https://github.com/requestNetwork/requestNetwork/blob/15fb307e/packages/request-client.js/src/api/currency/erc20.ts#L101)*

Get the amount of decimals for an ERC20 currency

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`currency` | ICurrency | The ERC20 Currency object |

**Returns:** *number*

The number of decimals for the ERC20 currency

___

###  getErc20FromSymbol

▸ **getErc20FromSymbol**(`symbol`: string): *[ITokenDescription](../interfaces/_src_api_currency_erc20_.itokendescription.md) | undefined*

*Defined in [request-client.js/src/api/currency/erc20.ts:144](https://github.com/requestNetwork/requestNetwork/blob/15fb307e/packages/request-client.js/src/api/currency/erc20.ts#L144)*

Get an ERC20 currency from the currency value string

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`symbol` | string | the ERC20 currency symbol string |

**Returns:** *[ITokenDescription](../interfaces/_src_api_currency_erc20_.itokendescription.md) | undefined*

the ERC20 ITokenDescription

___

###  getErc20Symbol

▸ **getErc20Symbol**(`currency`: ICurrency): *string | null*

*Defined in [request-client.js/src/api/currency/erc20.ts:170](https://github.com/requestNetwork/requestNetwork/blob/15fb307e/packages/request-client.js/src/api/currency/erc20.ts#L170)*

Get an ERC20 symbol from the Currency object

**Parameters:**

Name | Type |
------ | ------ |
`currency` | ICurrency |

**Returns:** *string | null*

the ERC20 currency symbol string

___

###  getMainnetErc20FromAddress

▸ **getMainnetErc20FromAddress**(`address`: string): *[ITokenDescription](../interfaces/_src_api_currency_erc20_.itokendescription.md) | undefined*

*Defined in [request-client.js/src/api/currency/erc20.ts:129](https://github.com/requestNetwork/requestNetwork/blob/15fb307e/packages/request-client.js/src/api/currency/erc20.ts#L129)*

Get an ERC20 currency from the currency address

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`address` | string | the ERC20 currency address |

**Returns:** *[ITokenDescription](../interfaces/_src_api_currency_erc20_.itokendescription.md) | undefined*

the ERC20 ITokenDescription

___

###  getSupportedERC20Tokens

▸ **getSupportedERC20Tokens**(): *Array‹object›*

*Defined in [request-client.js/src/api/currency/erc20.ts:195](https://github.com/requestNetwork/requestNetwork/blob/15fb307e/packages/request-client.js/src/api/currency/erc20.ts#L195)*

Returns a list of supported ERC20 currencies

**Returns:** *Array‹object›*

List of supported ERC20 currencies

___

###  validERC20Address

▸ **validERC20Address**(`address`: string): *boolean*

*Defined in [request-client.js/src/api/currency/erc20.ts:160](https://github.com/requestNetwork/requestNetwork/blob/15fb307e/packages/request-client.js/src/api/currency/erc20.ts#L160)*

Returns true if the address is a valid checksum address

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`address` | string | The address to validate |

**Returns:** *boolean*

If the address is valid or not

## Object literals

### `Const` supportedRinkebyERC20Details

### ▪ **supportedRinkebyERC20Details**: *object*

*Defined in [request-client.js/src/api/currency/erc20.ts:46](https://github.com/requestNetwork/requestNetwork/blob/15fb307e/packages/request-client.js/src/api/currency/erc20.ts#L46)*

▪ **CTBK**: *object*

*Defined in [request-client.js/src/api/currency/erc20.ts:48](https://github.com/requestNetwork/requestNetwork/blob/15fb307e/packages/request-client.js/src/api/currency/erc20.ts#L48)*

* **address**: *string* = "0x995d6a8c21f24be1dd04e105dd0d83758343e258"

* **decimals**: *number* = 18

* **name**: *string* = "Central Bank Token"

▪ **FAU**: *object*

*Defined in [request-client.js/src/api/currency/erc20.ts:55](https://github.com/requestNetwork/requestNetwork/blob/15fb307e/packages/request-client.js/src/api/currency/erc20.ts#L55)*

* **address**: *string* = "0xFab46E002BbF0b4509813474841E0716E6730136"

* **decimals**: *number* = 18

* **name**: *string* = "Faucet Token"
