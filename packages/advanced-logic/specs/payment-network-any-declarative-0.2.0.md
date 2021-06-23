# Payment Network - Any currency - Declarative

You can be interested in this document if:

- you want to create your own implementation of the Request protocol
- you are curious enough to dive and see what is under the hood of the Request protocol

Prerequisite: Having read the advanced logic specification (see [here](/packages/advanced-logic/specs)).

## Description

This extension allows to declare payments and the refunds in any currency.

The payments and refunds are documented by the payer, the payee of the request and optionnally a third party declared at the creation of the payment network (e.g: The third party could be a payment processor).

This extension does not ensure payment detection, only a consensus is made between the payer and the payee or by a third party.

As a payment network, this extension allows to deduce a payment `balance` for the request. (see
[Interpretation](#Interpretation))

## Properties

| Property                         | Type   | Description                                    | Requirement   |
| -------------------------------- | ------ | ---------------------------------------------- | ------------- |
| **id**                           | String | constant value: "pn-any-declarative"           | **Mandatory** |
| **type**                         | String | constant value: "paymentNetwork"               | **Mandatory** |
| **version**                      | String | constant value: "0.2.0"                        | **Mandatory** |
| **events**                       | Array  | List of the actions performed by the extension | **Mandatory** |
| **values**                       | Object |                                                |               |
| **values.sentPaymentAmount**     | Amount | Amount of payment declared sent                | **Mandatory** |
| **values.sentRefundAmount**      | Amount | Amount of refund declared sent                 | **Mandatory** |
| **values.receivedPaymentAmount** | Amount | Amount of payment declared received            | **Mandatory** |
| **values.receivedRefundAmount**  | Amount | Amount of refund declared received             | **Mandatory** |
| **values.paymentInstruction**    | String | Instruction to make payments                   | Optional      |
| **values.refundInstruction**     | String | Instruction to make refunds                    | Optional      |
| **values.thirdparty**    | [Identity](../request-logic/specs/request-logic-specification.md#identity-role-and-signature) | Identity of the third party | Optional      |

---

## Actions

### Creation

#### Parameters

|                                   | Type   | Description                          | Requirement   |
| --------------------------------- | ------ | ------------------------------------ | ------------- |
| **id**                            | String | constant value: "pn-any-declarative" | **Mandatory** |
| **type**                          | String | constant value: "paymentNetwork"     | **Mandatory** |
| **version**                       | String | constant value: "0.2.0"              | **Mandatory** |
| **parameters**                    | Object |                                      |               |
| **parameters.paymentInstruction** | String | Instruction to make payments         | Optional      |
| **parameters.refundInstruction**  | String | Instruction to make refunds          | Optional      |
| **parameters.thirdparty**    | [Identity](../request-logic/specs/request-logic-specification.md#identity-role-and-signature) | Identity of the third party | Optional      |

#### Conditions

None.

#### Warnings

This action must trigger the warnings:

| Warning                                     | Condition                                                       |
| ------------------------------------------- | --------------------------------------------------------------- |
| "paymentInstruction is given by the payer"  | if `signer` is the payer **and** `paymentInstruction` is given  |
| "refundInstruction is given by the payee"   | if `signer` is the payee **and** `refundInstruction` is given   |

Note: These warnings are necessary to highlight to avoid attempt of fake payment and refund instructions.

#### Results

A extension state is created with the following properties:

|  Property                        |  Value                                                             |
| -------------------------------- | ------------------------------------------------------------------ |
| **id**                           | "pn-any-declarative"                                               |
| **type**                         | "paymentNetwork"                                                   |
| **version**                      | "0.2.0"                                                            |
| **values**                       |                                                                    |
| **values.paymentInstruction**    | `paymentInstruction` from parameters if given, undefined otherwise |
| **values.refundInstruction**     | `refundInstruction` from parameters if given, undefined otherwise  |
| **values.sentPaymentAmount**     | "0"                                                                |
| **values.sentRefundAmount**      | "0"                                                                |
| **values.receivedRefundAmount**  | "0"                                                                |
| **values.receivedPaymentAmount** | "0"                                                                |
| **values.thirdparty**            | `thirdparty` from parameters if given, undefined otherwise         |
| **events**                       | Array with one 'create' event (see below)                          |

the 'create' event:

|  Property                         |  Value                                                             |
| --------------------------------- | ------------------------------------------------------------------ |
| **name**                          | 'create'                                                           |
| **parameters**                    |                                                                    |
| **parameters.paymentInstruction** | `paymentInstruction` from parameters if given, undefined otherwise |
| **parameters.refundInstruction**  | `refundInstruction` from parameters if given, undefined otherwise  |
| **parameters.thirdparty**         | `thirdparty` from parameters if given, undefined otherwise         |

---

### Updates

#### declareSentPayment

##### Parameters

|                       | Type   | Description                              | Requirement   |
| --------------------- | ------ | ---------------------------------------- | ------------- |
| **id**                | String | constant value: "pn-any-declarative"     | **Mandatory** |
| **action**            | String | constant value: "declareSentPayment"     | **Mandatory** |
| **parameters**        | Object |                                          |               |
| **parameters.amount** | Amount | Amount of the payment                    | **Mandatory** |
| **parameters.note**   | String | Additional information about the payment | Optional      |

##### Conditions

This action is valid, if:

- The extension state with the id "pn-any-declarative" exists
- The signer is the `payer` or the `thirdparty`

##### Warnings

None.

##### Results

A extension state is updated with the following properties:

|  Property                    |  Value                                                   |
| ---------------------------- | -------------------------------------------------------- |
| **values.sentPaymentAmount** | `sentPaymentAmount` is increased by the `amount` given   |
| **events**                   | add an 'declareSentPayment' event (see below) at its end |

the 'declareSentPayment' event:

|  Property             |  Value                                               |
| --------------------- | ---------------------------------------------------- |
| **name**              | constant value: "declareSentPayment"                 |
| **parameters**        |                                                      |
| **parameters.amount** | `amount` from parameters                             |
| **parameters.note**   | `note` from parameters if given, undefined otherwise |

#### declareReceivedPayment

##### Parameters

|                       | Type   | Description                              | Requirement   |
| --------------------- | ------ | ---------------------------------------- | ------------- |
| **id**                | String | constant value: "pn-any-declarative"     | **Mandatory** |
| **action**            | String | constant value: "declareReceivedPayment" | **Mandatory** |
| **parameters**        | Object |                                          |               |
| **parameters.amount** | Amount | Amount of the payment                    | **Mandatory** |
| **parameters.note**   | String | Additional information about the payment | Optional      |

##### Conditions

This action is valid, if:

- The extension state with the id "pn-any-declarative" exists
- The signer is the `payee` or the `thirdparty`

##### Warnings

None.

##### Results

A extension state is updated with the following properties:

|  Property                       |  Value                                                       |
| ------------------------------- | ------------------------------------------------------------ |
| **values.receivedRefundAmount** | `receivedRefundAmount` is increased by the `amount` given    |
| **events**                      | add an 'declareReceivedPayment' event (see below) at its end |

the 'declareReceivedPayment' event:

|  Property             |  Value                                               |
| --------------------- | ---------------------------------------------------- |
| **name**              | constant value: "declareReceivedPayment"             |
| **parameters**        |                                                      |
| **parameters.amount** | `amount` from parameters                             |
| **parameters.note**   | `note` from parameters if given, undefined otherwise |

#### declareSentPayment

##### Parameters

|                       | Type   | Description                             | Requirement   |
| --------------------- | ------ | --------------------------------------- | ------------- |
| **id**                | String | constant value: "pn-any-declarative"    | **Mandatory** |
| **action**            | String | constant value: "declareSentPayment"    | **Mandatory** |
| **parameters**        | Object |                                         |               |
| **parameters.amount** | Amount | Amount of the refund                    | **Mandatory** |
| **parameters.note**   | String | Additional information about the refund | Optional      |

##### Conditions

This action is valid, if:

- The extension state with the id "pn-any-declarative" exists
- The signer is the `payee` or the `thirdparty`

##### Warnings

None.

##### Results

A extension state is updated with the following properties:

|  Property                   |  Value                                                   |
| --------------------------- | -------------------------------------------------------- |
| **values.sentRefundAmount** | `sentRefundAmount` is increased by the `amount` given    |
| **events**                  | add an 'declareSentPayment' event (see below) at its end |

the 'declareSentPayment' event:

|  Property             |  Value                                               |
| --------------------- | ---------------------------------------------------- |
| **name**              | constant value: "declareSentPayment"                 |
| **parameters**        |                                                      |
| **parameters.amount** | `amount` from parameters                             |
| **parameters.note**   | `note` from parameters if given, undefined otherwise |

#### declareReceivedRefund

##### Parameters

|                       | Type   | Description                             | Requirement   |
| --------------------- | ------ | --------------------------------------- | ------------- |
| **id**                | String | constant value: "pn-any-declarative"    | **Mandatory** |
| **action**            | String | constant value: "declareReceivedRefund" | **Mandatory** |
| **parameters**        | Object |                                         |               |
| **parameters.amount** | Amount | Amount of the refund                    | **Mandatory** |
| **parameters.note**   | String | Additional information about the refund | Optional      |

##### Conditions

This action is valid, if:

- The extension state with the id "pn-any-declarative" exists
- The signer is the `payer` or the `thirdparty`

##### Warnings

None.

##### Results

A extension state is updated with the following properties:

|  Property                        |  Value                                                      |
| -------------------------------- | ----------------------------------------------------------- |
| **values.receivedPaymentAmount** | `receivedPaymentAmount` is increased by the `amount` given  |
| **events**                       | add an 'declareReceivedRefund' event (see below) at its end |

the 'declareReceivedRefund' event:

|  Property             |  Value                                               |
| --------------------- | ---------------------------------------------------- |
| **name**              | constant value: "declareReceivedRefund"              |
| **parameters**        |                                                      |
| **parameters.amount** | `amount` from parameters                             |
| **parameters.note**   | `note` from parameters if given, undefined otherwise |

#### addRefundInstruction

##### Parameters

|                                  | Type   | Description                          | Requirement   |
| -------------------------------- | ------ | ------------------------------------ | ------------- |
| **id**                           | String | constant value: "pn-any-declarative" | **Mandatory** |
| **action**                       | String | constant value: "addRefundAddress"   | **Mandatory** |
| **parameters**                   | Object |                                      |               |
| **parameters.refundInstruction** | String | Instruction to make refunds          | Optional      |

##### Conditions

This action is valid, if:

- The extension state with the id "pn-any-declarative" exists
- The signer is the `payer` or the `thirdparty`
- The extension property `refundInstruction` is undefined

##### Warnings

None.

##### Results

A extension state is updated with the following properties:

|  Property                    |  Value                                                     |
| ---------------------------- | ---------------------------------------------------------- |
| **values.refundInstruction** | `refundInstruction` from parameters                        |
| **events**                   | add an 'addRefundInstruction' event (see below) at its end |

The 'addRefundInstruction' event:

|  Property                        |  Value                              |
| -------------------------------- | ----------------------------------- |
| **name**                         | 'addRefundInstruction'              |
| **parameters**                   |                                     |
| **parameters.refundInstruction** | `refundInstruction` from parameters |

#### addPaymentInstruction

##### Parameters

|                                   | Type   | Description                          | Requirement   |
| --------------------------------- | ------ | ------------------------------------ | ------------- |
| **id**                            | String | constant value: "pn-any-declarative" | **Mandatory** |
| **action**                        | String | constant value: "addPaymentAddress"  | **Mandatory** |
| **parameters**                    | Object |                                      |               |
| **parameters.paymentInstruction** | String | Instruction to make payments         | Optional      |

##### Conditions

This action is valid, if:

- The extension state with the id "pn-any-declarative" exists
- The signer is the `payer` or the `thirdparty`
- The extension property `paymentInstruction` is undefined

##### Warnings

None.

##### Results

A extension state is updated with the following properties:

|  Property                     |  Value                                                      |
| ----------------------------- | ----------------------------------------------------------- |
| **values.paymentInstruction** | `paymentInstruction` from parameters                        |
| **events**                    | add an 'addPaymentInstruction' event (see below) at its end |

The 'addPaymentInstruction' event:

|  Property                         |  Value                               |
| --------------------------------- | ------------------------------------ |
| **name**                          | 'addPaymentInstruction'              |
| **parameters**                    |                                      |
| **parameters.paymentInstruction** | `paymentInstruction` from parameters |

---

## Interpretation

The `balance` starts from `0`.
Only the amount given in `receivedPaymentAmount` should increase the `balance`.
Only the amount given in `receivedRefundAmount` should reduce the `balance`.
`sentPaymentAmount` and `sentRefundAmount` should be used as informative data or for arbitration of dispute.

However, this interpretation can vary regarding the level of trust between the payer and the payee.
