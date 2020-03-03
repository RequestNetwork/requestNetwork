# Payment Network - Bitcoin - Address based

You can be interested in this document if:

- you want to create your own implementation of the Request protocol
- you are curious enough to dive and see what is under the hood of the Request protocol

Prerequisite: Having read the advanced logic specification (see [here](./advanced-logic-specs-0.1.0.md)).

## Description

This extension allows the payments and the refunds to be made on the Bitcoin blockchain.
One address for the payment and one for the refund must be created and used exclusively for **one and only one** request.

As a payment network, this extension allows to deduce a payment `balance` for the request. (see
[Interpretation](#Interpretation))

## Properties

| Property                  | Type   | Description                                    | Requirement   |
| ------------------------- | ------ | ---------------------------------------------- | ------------- |
| **id**                    | String | constant value: "pn-btc-address-based"         | **Mandatory** |
| **type**                  | String | constant value: "paymentNetwork"               | **Mandatory** |
| **version**               | String | constant value: "0.1.0"                        | **Mandatory** |
| **events**                | Array  | List of the actions performed by the extension | **Mandatory** |
| **values**                | Object |                                                |               |
| **values.paymentAddress** | String | Bitcoin address for the payment                | Optional      |
| **values.refundAddress**  | String | Bitcoin address for the refund                 | Optional      |

Note: to use the bitcoin testnet just replace the id by "pn-testnet-bitcoin-address-based"

---

## Actions

### Creation

#### Parameters

|                               | Type   | Description                            | Requirement   |
| ----------------------------- | ------ | -------------------------------------- | ------------- |
| **id**                        | String | constant value: "pn-btc-address-based" | **Mandatory** |
| **type**                      | String | constant value: "paymentNetwork"       | **Mandatory** |
| **version**                   | String | constant value: "0.1.0"                | **Mandatory** |
| **parameters**                | Object |                                        |               |
| **parameters.paymentAddress** | String | Bitcoin address for the payment        | Optional      |
| **parameters.refundAddress**  | String | Bitcoin address for the refund         | Optional      |

#### Conditions

This action is valid, if:

- The request `currency.type` must be "BTC"

#### Warnings

This action must trigger the warnings:

| Warning                                 | Condition                                                   |
| --------------------------------------- | ----------------------------------------------------------- |
| "paymentAddress is given by the payer"  | if `signer` is the payer **and** `paymentAddress` is given  |
| "refundAddress is given by the payee"   | if `signer` is the payee **and** `refundAddress` is given   |

Note: These warnings are necessary to highlight to avoid attempt of fake payments and refunds. For example, a payer could create a request given as the payment address one of his own address. A system could interpret a transaction to this address as payment while the payee does not receive anything.

#### Results

A extension state is created with the following properties:

|  Property                 |  Value                                                         |
| ------------------------- | -------------------------------------------------------------- |
| **id**                    | "pn-btc-address-based"                                         |
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

|                               | Type   | Description                            | Requirement   |
| ----------------------------- | ------ | -------------------------------------- | ------------- |
| **id**                        | String | constant value: "pn-btc-address-based" | **Mandatory** |
| **action**                    | String | constant value: "addPaymentAddress"    | **Mandatory** |
| **parameters**                | Object |                                        |               |
| **parameters.paymentAddress** | String | Bitcoin address for the payment        | **Mandatory** |

##### Conditions

This action is valid, if:

- The extension state with the id "pn-btc-address-based" exists
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

|                              | Type   | Description                            | Requirement   |
| ---------------------------- | ------ | -------------------------------------- | ------------- |
| **id**                       | String | constant value: "pn-btc-address-based" | **Mandatory** |
| **action**                   | String | constant value: "addRefundAddress"     | **Mandatory** |
| **parameters**               | Object |                                        |               |
| **parameters.refundAddress** | String | Bitcoin address for the refund         | **Mandatory** |

##### Conditions

This action is valid, if:

- The extension state with the id "pn-btc-address-based" exists
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
Any bitcoin transaction reaching the address `addPaymentAddress` is considered as payment. The `balance` is increased by the amount of the transaction.
Any bitcoin transaction reaching the address `addRefundAddress` is considered as a refund. The `balance` is reduced by the amount of the transaction.
