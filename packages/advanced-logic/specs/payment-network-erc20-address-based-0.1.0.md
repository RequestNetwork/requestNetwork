# Payment Network - ERC-20 - Address based

You may be interested in this document if:

- you want to create your own implementation of the Request protocol
- you are curious enough to dive and see what is under the hood of the Request protocol

Prerequisite: Having read the advanced logic specification (see [here](./advanced-logic-specs-0.1.0.md)).

## Description

This extension allows the payments and the refunds to be made on ERC-20 tokens on the Ethereum blockchain.
One new address for the payment and one for the refund must be created and used exclusively for **one and only one** request.

As a payment network, this extension allows to deduce a payment `balance` for the request. (see
[Interpretation](#Interpretation))

## Properties

| Property                  | Type   | Description                                    | Requirement   |
| ------------------------- | ------ | ---------------------------------------------- | ------------- |
| **id**                    | String | constant value: "pn-erc20-address-based"       | **Mandatory** |
| **type**                  | String | constant value: "paymentNetwork"               | **Mandatory** |
| **version**               | String | constant value: "0.1.0"                        | **Mandatory** |
| **events**                | Array  | List of the actions performed by the extension | **Mandatory** |
| **values**                | Object |                                                |               |
| **values.paymentAddress** | String | Ethereum address for the payment               | Optional      |
| **values.refundAddress**  | String | Ethereum address for the refund                | Optional      |

Note: to use the Rinkeby testnet just replace the id by "pn-rinkeby-erc20-address-based"

---

## Actions

### Creation

#### Parameters

|                               | Type   | Description                              | Requirement   |
| ----------------------------- | ------ | ---------------------------------------- | ------------- |
| **id**                        | String | constant value: "pn-erc20-address-based" | **Mandatory** |
| **type**                      | String | constant value: "paymentNetwork"         | **Mandatory** |
| **version**                   | String | constant value: "0.1.0"                  | **Mandatory** |
| **parameters**                | Object |                                          |               |
| **parameters.paymentAddress** | String | Ethereum address for the payment         | Optional      |
| **parameters.refundAddress**  | String | Ethereum address for the refund          | Optional      |

#### Conditions

This action is valid if:

- The request `currency` must be an ERC-20 from our list of valid ERC-20 (TODO: add link).

#### Warnings

This action must trigger the warnings:

| Warning                                 | Condition                                                   |
| --------------------------------------- | ----------------------------------------------------------- |
| "paymentAddress is given by the payer"  | if `signer` is the payer **and** `paymentAddress` is given  |
| "refundAddress is given by the payee"   | if `signer` is the payee **and** `refundAddress` is given   |

Note: These warnings are necessary to highlight to avoid attempts of fake payments and refunds. For example, a payer could create a request using as the payment address one of his own addresses. A system could interpret a transaction to this address as a payment while the payee did not receive the funds.

#### Results

A extension state is created with the following properties:

|  Property                 |  Value                                                         |
| ------------------------- | -------------------------------------------------------------- |
| **id**                    | "pn-erc20-address-based"                                       |
| **type**                  | "paymentNetwork"                                               |
| **version**               | "0.1.0"                                                        |
| **values**                |                                                                |
| **values.paymentAddress** | `paymentAddress` from parameters if given, undefined otherwise |
| **values.refundAddress**  | `refundAddress` from parameters if given, undefined otherwise  |
| **events**                | Array with one 'create' event (see below)                      |

the 'create' event:

|  Property                     |  Value                                                         |
| ----------------------------- | -------------------------------------------------------------- |
| **name**                      | 'create'                                                       |
| **parameters**                |                                                                |
| **parameters.paymentAddress** | `paymentAddress` from parameters if given, undefined otherwise |
| **parameters.refundAddress**  | `refundAddress` from parameters if given, undefined otherwise  |

---

### Updates

#### addPaymentAddress

##### Parameters

|                               | Type   | Description                              | Requirement   |
| ----------------------------- | ------ | ---------------------------------------- | ------------- |
| **id**                        | String | constant value: "pn-erc20-address-based" | **Mandatory** |
| **action**                    | String | constant value: "addPaymentAddress"      | **Mandatory** |
| **parameters**                | Object |                                          |               |
| **parameters.paymentAddress** | String | Ethereum address for the payment         | **Mandatory** |

##### Conditions

This action is valid, if:

- The extension state with the id "pn-erc20-address-based" exists
- The signer is the `payee`
- The extension property `paymentAddress` is undefined

##### Warnings

None.

##### Results

A extension state is updated with the following properties:

|  Property                 |  Value                                               |
| ------------------------- | ---------------------------------------------------- |
| **values.paymentAddress** | `paymentAddress` from parameters                     |
| **events**                | add an 'paymentAddress' event (see below) at its end |

the 'addPaymentAddress' event:

|  Property                     |  Value                              |
| ----------------------------- | ----------------------------------- |
| **name**                      | constant value: "addPaymentAddress" |
| **parameters**                |                                     |
| **parameters.paymentAddress** | `paymentAddress` from parameters    |

#### addRefundAddress

##### Parameters

|                              | Type   | Description                              | Requirement   |
| ---------------------------- | ------ | ---------------------------------------- | ------------- |
| **id**                       | String | constant value: "pn-erc20-address-based" | **Mandatory** |
| **action**                   | String | constant value: "addRefundAddress"       | **Mandatory** |
| **parameters**               | Object |                                          |               |
| **parameters.refundAddress** | String | Ethereum address for the refund          | **Mandatory** |

##### Conditions

This action is valid if:

- The extension state with the id "pn-erc20-address-based" exists
- The signer is the `payer`
- The extension property `refundAddress` is undefined

##### Warnings

None.

##### Results

A extension state is updated with the following properties:

|  Property                |  Value                                                 |
| ------------------------ | ------------------------------------------------------ |
| **values.refundAddress** | `refundAddress` from parameters                        |
| **events**               | add an 'addRefundAddress' event (see below) at its end |

The 'addRefundAddress' event:

|  Property                    |  Value                          |
| ---------------------------- | ------------------------------- |
| **name**                     | 'addRefundAddress'              |
| **parameters**               |                                 |
| **parameters.refundAddress** | `refundAddress` from parameters |

---

## Interpretation

The `balance` starts from `0`.
Any transaction from the request `currency` ERC-20 contract destined to the `addPaymentAddress` is considered as a payment. The `balance` is increased by the sum of the amounts of the transactions.
Any ERC-20 transaction reaching the address `addRefundAddress` is considered as a refund. The `balance` is reduced by the sum of the amounts of the transactions.
