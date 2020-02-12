# Payment Network - ERC20 - proxy contract

You may be interested in this document if:

- you want to create your own implementation of the Request protocol
- you are curious enough to dive and see what is under the hood of the Request protocol

Prerequisite: Having read the advanced logic specification (see [here](./advanced-logic-specs-0.1.0.md)).

## Description

This extension allows the payments and the refunds to be made in ERC20 tokens on the Ethereum blockchain.
The payment is made through a proxy contract. This proxy contract does the ERC20 token transfer on behalf of
the user. The contract ensures a link between an ERC20 transfer and a request through a `paymentReference`.
This `paymentReference` consists of the last 8 bytes of a salted hash of the requestId: `last8Bytes(hash(lowercase(requestId + salt + address)))`:

- `requestId` is the id of the request
- `salt` is a random number with at least 8 bytes of randomness. It must be unique to each request
- `address` is the payment address for payments, the refund address for refunds
- `lowercase()` transforms all characters to lowercase
- `hash()` is a keccak256 hash function
- `last8Bytes()` take the last 8 bytes

As a payment network, this extension allows to deduce a payment `balance` for the request. (see
[Interpretation](#Interpretation))

## Contract

The contract contains one function called `transferFromWithReference` which takes 4 arguments:

- `tokenAddress` is the address of the ERC20 contract
- `to` is the destination address for the tokens
- `amount` is the amount of tokens
- `paymentReference` is the reference data used to track the transfer (see `paymentReference`)

The `TransferWithReference` event is emitted when the tokens are transfered. This event contains the same 4 arguments as the `transferFromWithReference` function.

[See smart contract source](https://github.com/RequestNetwork/requestNetwork/blob/master/packages/smart-contracts/src/contracts/ERC20Proxy.sol)

| Network | Contract Address                           |
|---------|--------------------------------------------|
| Mainnet | 0x5f821c20947ff9be22e823edc5b3c709b33121b3 |
| Rinkeby | 0x162edb802fae75b9ee4288345735008ba51a4ec9 |

## Properties

| Property                  | Type   | Description                                    | Requirement   |
| ------------------------- | ------ | ---------------------------------------------- | ------------- |
| **id**                    | String | constant value: "pn-erc20-proxy-contract"      | **Mandatory** |
| **type**                  | String | constant value: "paymentNetwork"               | **Mandatory** |
| **version**               | String | constant value: "0.1.0"                        | **Mandatory** |
| **events**                | Array  | List of the actions performed by the extension | **Mandatory** |
| **values**                | Object |                                                |               |
| **values.salt**           | String | Salt for the request                           | **Mandatory**      |
| **values.paymentAddress** | String | Ethereum address for the payment               | Optional      |
| **values.refundAddress**  | String | Ethereum address for the refund                | Optional      |


Note: to use the Rinkeby testnet, create a request with `currency.network` as `rinkeby`.

---

## Actions

### Creation

#### Parameters

|                               | Type   | Description                               | Requirement   |
| ----------------------------- | ------ | --------------------------------          | ------------- |
| **id**                        | String | Constant value: "pn-erc20-proxy-contract" | **Mandatory** |
| **type**                      | String | Constant value: "paymentNetwork"          | **Mandatory** |
| **version**                   | String | Constant value: "0.1.0"                   | **Mandatory** |
| **parameters**                | Object |                                           |               |
| **parameters.salt**           | String | Salt for the request                      | **Mandatory** |
| **parameters.paymentAddress** | String | Ethereum address for the payment          | Optional      |
| **parameters.refundAddress**  | String | Ethereum address for the refund           | Optional      |


#### Conditions

This action is valid if:

- The `salt` is not empty and long enough (8 bytes of randomness minimum).
- The `currency.type` is ERC20.

#### Warnings

This action must trigger the warnings:

| Warning                                 | Condition                                                   |
| --------------------------------------- | ----------------------------------------------------------- |
| "paymentAddress is given by the payer"  | If `signer` is the payer **and** `paymentAddress` is given  |
| "refundAddress is given by the payee"   | If `signer` is the payee **and** `refundAddress` is given   |

Note: These warnings are necessary to highlight to avoid attempts of fake payments and refunds. For example, a payer could create a request using as the payment address one of his own addresses. A system could interpret a transaction to this address as a payment while the payee did not receive the funds.

#### Results

An extension state is created with the following properties:

|  Property                 |  Value                                                         |
| ------------------------- | -------------------------------------------------------------- |
| **id**                    | "pn-erc20-proxy-contract"                                      |
| **type**                  | "paymentNetwork"                                               |
| **version**               | "0.1.0"                                                        |
| **values**                |                                                                |
| **values.paymentAddress** | `paymentAddress` from parameters if given, undefined otherwise |
| **values.refundAddress**  | `refundAddress` from parameters if given, undefined otherwise  |
| **values.salt**           | Salt for the request                                           |
| **events**                | Array with one 'create' event (see below)                      |

the 'create' event:

|  Property                     |  Value                                                         |
| ----------------------------- | -------------------------------------------------------------- |
| **name**                      | 'create'                                                       |
| **parameters**                |                                                                |
| **parameters.paymentAddress** | `paymentAddress` from parameters if given, undefined otherwise |
| **parameters.refundAddress**  | `refundAddress` from parameters if given, undefined otherwise  |
| **parameters.salt**           | Salt for the request                                           |

---

### Updates

#### addPaymentAddress

##### Parameters

|                               | Type   | Description                               | Requirement   |
| ----------------------------- | ------ | -----------------------------------       | ------------- |
| **id**                        | String | Constant value: "pn-erc20-proxy-contract" | **Mandatory** |
| **action**                    | String | Constant value: "addPaymentAddress"       | **Mandatory** |
| **parameters**                | Object |                                           |               |
| **parameters.paymentAddress** | String | Ethereum address for the payment          | **Mandatory** |

##### Conditions

This action is valid, if:

- The extension state with the id "pn-erc20-proxy-contract" exists
- The signer is the `payee`
- The extension property `paymentAddress` is undefined

##### Warnings

None.

##### Results

An extension state is updated with the following properties:

|  Property                  |  Value                                               |
| -------------------------- | ---------------------------------------------------- |
| **values.paymentAddress**  | `paymentAddress` from parameters                     |
| **events**                 | Add an 'paymentAddress' event (see below) at its end |

the 'addPaymentAddress' event:

|  Property                     |  Value                              |
| ----------------------------- | ----------------------------------- |
| **name**                      | Constant value: "addPaymentAddress" |
| **parameters**                |                                     |
| **parameters.paymentAddress** | `paymentAddress` from parameters    |

#### addRefundAddress

##### Parameters

|                              | Type   | Description                               | Requirement   |
| ---------------------------- | ------ | ----------------------------------        | ------------- |
| **id**                       | String | Constant value: "pn-erc20-proxy-contract" | **Mandatory** |
| **action**                   | String | Constant value: "addRefundAddress"        | **Mandatory** |
| **parameters**               | Object |                                           |               |
| **parameters.refundAddress** | String | Ethereum address for the refund           | **Mandatory** |

##### Conditions

This action is valid if:

- The extension state with the id "pn-erc20-proxy-contract" exists
- The signer is the `payer`
- The extension property `refundAddress` is undefined

##### Warnings

None.

##### Results

An extension state is updated with the following properties:

|  Property                |  Value                                                 |
| ------------------------ | ------------------------------------------------------ |
| **values.refundAddress** | `refundAddress` from parameters                        |
| **events**               | Add an 'addRefundAddress' event (see below) at its end |

The 'addRefundAddress' event:

|  Property                    |  Value                          |
| ---------------------------- | ------------------------------- |
| **name**                     | 'addRefundAddress'              |
| **parameters**               |                                 |
| **parameters.refundAddress** | `refundAddress` from parameters |

---

## Interpretation

The proxy contract address is determined by the `request.currency.network` (see (table)[#Contract] with proxy contract addresses).

Any `TransferWithReference` events emitted from the proxy contract with the following arguments are considered as a payment:
- `tokenAddress` `===` `request.currency.value`
- `to` `===` `paymentAddress`
- `paymentReference` `===` `last8Bytes(hash(lowercase(requestId + salt + payment address)))`

Any `TransferWithReference` events emitted from the proxy contract with the following arguments are considered as a refund:
- `tokenAddress` `===` `request.currency.value`
- `to` `===` `refundAddress`
- `paymentReference` `===` `last8Bytes(hash(lowercase(requestId + salt + refund address)))`

The sum of payment amounts minus the sum of refund amounts is considered the balance.
