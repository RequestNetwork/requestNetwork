# Payment Network - ETH - input data

## Description

This extension allows the payments and the refunds to be made in Ether on the Ethereum blockchain, or in any native token of an EVM chain.
A payment reference has to be given when making the transfer to link the payment to the request.

There are three ways to match payments for the concerned request (and payment reference):

1. The payer transfers native tokens add the reference to the input data
2. The payer calls the ETH proxy smart contract (see [Contract](#Contract))
3. The issuer declares a payment manually

The payment reference is the last 8 bytes of a salted hash of the requestId: `last8Bytes(hash(lowercase(requestId + salt + address)))`:

- `requestId` is the id of the request
- `salt` is a random number with at least 8 bytes of randomness. It must be unique to each request
- `address` is the payment address for payments, the refund address for refunds
- `hash()` is a keccak256 hash function
- `last8Bytes()` take the last 8 bytes

As a payment network, this extension allows to deduce a payment `balance` for the request. (see [Interpretation](#Interpretation))

## Manual payment declaration

The issuer can declare that he received a payment and give the amount, possibly with a `txHash` for documentation.

## Contract

The contract contains one function called `transferWithReference` which takes 2 arguments:

- `to` is the destination address
- `paymentReference` is the reference data used to track the transfer (see `paymentReference`)

The `TransferWithReference` event is emitted when the Ether is transfered. This event contains the same 2 arguments as the `transferWithReference` function plus the `amount` of ethereum sent.

[See smart contract source](https://github.com/RequestNetwork/requestNetwork/blob/master/packages/smart-contracts/src/contracts/EthereumProxy.sol)

| Network | Contract Address                           |
| ------- | ------------------------------------------ |
| Mainnet | 0x37a8f5f64f2a84f2377481537f04d2a59c9f59b6 |
| Rinkeby | 0x9c6c7817e3679c4b3f9ef9486001eae5aaed25ff |

## Properties

| Property                  | Type   | Description                                    | Requirement   |
| ------------------------- | ------ | ---------------------------------------------- | ------------- |
| **id**                    | String | constant value: "pn-eth-input-data"            | **Mandatory** |
| **type**                  | String | constant value: "paymentNetwork"               | **Mandatory** |
| **version**               | String | constant value: "0.2.0"                        | **Mandatory** |
| **events**                | Array  | List of the actions performed by the extension | **Mandatory** |
| **values**                | Object |                                                |               |
| **values.paymentAddress** | String | Blockchain address for the payment             | Optional      |
| **values.refundAddress**  | String | Blockchain address for the refund              | Optional      |
| **values.salt**           | String | Salt for the request                           | **Mandatory** |

---

## Action: Creation

### Parameters

|                               | Type   | Description                         | Requirement   |
| ----------------------------- | ------ | ----------------------------------- | ------------- |
| **id**                        | String | Constant value: "pn-eth-input-data" | **Mandatory** |
| **type**                      | String | Constant value: "paymentNetwork"    | **Mandatory** |
| **version**                   | String | Constant value: "0.2.0"             | **Mandatory** |
| **parameters**                | Object |                                     |               |
| **parameters.paymentAddress** | String | Blockchain address for the payment  | Optional      |
| **parameters.refundAddress**  | String | Blockchain address for the refund   | Optional      |
| **parameters.salt**           | String | Salt for the request                | **Mandatory** |

### Conditions

This action is valid if:

- The request `currency.type` must be "ETH" or an EVM chain native token
- The request `currency.network` must be "mainnet", "rinkeby" or an EVM chain
- The `salt` is not empty and long enough (8 bytes of randomness minimum).

### Warnings

This action must trigger the warnings:

| Warning                                 | Condition                                                   |
| --------------------------------------- | ----------------------------------------------------------- |
| "paymentAddress is given by the payer"  | If `signer` is the payer **and** `paymentAddress` is given  |
| "refundAddress is given by the payee"   | If `signer` is the payee **and** `refundAddress` is given   |

Note: These warnings are necessary to highlight and avoid attempts of fake payments and refunds. For example, a payer could create a request using as the payment address one of his own addresses. A system could interpret a transaction to this address as a payment while the payee did not receive the funds.

### Results

An extension state is created with the following properties:

|  Property                 |  Value                                                         |
| ------------------------- | -------------------------------------------------------------- |
| **id**                    | "pn-eth-input-data"                                            |
| **type**                  | "paymentNetwork"                                               |
| **version**               | "0.2.0"                                                        |
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

## Action: addPaymentAddress

### Parameters

|                               | Type   | Description                         | Requirement   |
| ----------------------------- | ------ | ----------------------------------- | ------------- |
| **id**                        | String | Constant value: "pn-eth-input-data" | **Mandatory** |
| **action**                    | String | Constant value: "addPaymentAddress" | **Mandatory** |
| **parameters**                | Object |                                     |               |
| **parameters.paymentAddress** | String | Blockchain address for the payment  | **Mandatory** |

### Conditions

This action is valid, if:

- The extension state with the id "pn-eth-input-data" exists
- The signer is the `payee`
- The extension property `paymentAddress` is undefined

### Warnings

None.

### Results

The extension state is updated with the following properties:

|  Property                  |  Value                                               |
| -------------------------- | ---------------------------------------------------- |
| **values.paymentAddress**  | `paymentAddress` from parameters                     |
| **parameters.paymentSalt** | Salt for the payment                                 |
| **events**                 | Add an 'paymentAddress' event (see below) at its end |

the 'addPaymentAddress' event:

|  Property                     |  Value                              |
| ----------------------------- | ----------------------------------- |
| **name**                      | Constant value: "addPaymentAddress" |
| **parameters**                |                                     |
| **parameters.paymentAddress** | `paymentAddress` from parameters    |

## Action: addRefundAddress

### Parameters

|                              | Type   | Description                         | Requirement   |
| ---------------------------- | ------ | ----------------------------------- | ------------- |
| **id**                       | String | Constant value: "pn-eth-input-data" | **Mandatory** |
| **action**                   | String | Constant value: "addRefundAddress"  | **Mandatory** |
| **parameters**               | Object |                                     |               |
| **parameters.refundAddress** | String | Blockchain address for the refund   | **Mandatory** |

### Conditions

This action is valid if:

- The extension state with the id "pn-eth-input-data" exists
- The signer is the `payer`
- The extension property `refundAddress` is undefined

### Warnings

None.

### Results

The extension state is updated with the following properties:

|  Property                |  Value                                                 |
| ------------------------ | ------------------------------------------------------ |
| **values.refundAddress** | `refundAddress` from parameters                        |
| **values.refundSalt**    | Salt for the refund                                    |
| **events**               | Add an 'addRefundAddress' event (see below) at its end |

The 'addRefundAddress' event:

|  Property                    |  Value                          |
| ---------------------------- | ------------------------------- |
| **name**                     | 'addRefundAddress'              |
| **parameters**               |                                 |
| **parameters.refundAddress** | `refundAddress` from parameters |

## Action: declareReceivedPayment

### Parameters

|                       | Type   | Description                                          | Requirement   |
| --------------------- | ------ | ---------------------------------------------------- | ------------- |
| **id**                | String | Constant value: "pn-eth-input-data"                  | **Mandatory** |
| **action**            | String | Constant value: "declareReceivedPayment"             | **Mandatory** |
| **parameters**        | Object |                                                      |               |
| **parameters.amount** | String | The amount declared as received, in request currency | **Mandatory** |
| **parameters.note**   | String | Additional information about the payment             | Optional      |
| **parameters.txHash** | String | The transaction hash for documentation and metadata  | Optional      |

### Conditions

This action is valid, if:

- The extension state with the id "pn-eth-input-data" exists
- The signer is the `payee`

### warnings

None.

### Results

An event is added to the extension state events array:

|  Property             |  Value                                   |
| --------------------- | -----------------------------------------|
| **name**              | Constant value: "declareReceivedPayment" |
| **parameters**        |                                          |
| **parameters.amount** | `amount` from parameters                 |
| **parameters.note**   | `note` from parameters                   |
| **parameters.txHash** | `txHash` from parameters or undefined    |

## Action: declareReceivedRefund

### Parameters

|                       | Type   | Description                                          | Requirement   |
| --------------------- | ------ | ---------------------------------------------------- | ------------- |
| **id**                | String | Constant value: "pn-eth-input-data"                  | **Mandatory** |
| **action**            | String | Constant value: "declareReceivedRefund"              | **Mandatory** |
| **parameters**        | Object |                                                      |               |
| **parameters.amount** | String | The amount declared as received, in request currency | **Mandatory** |
| **parameters.note**   | String | Additional information about the payment             | Optional      |
| **parameters.txHash** | String | The transaction hash for documentation and metadata  | Optional      |

### Conditions

This action is valid, if:

- The extension state with the id "pn-eth-input-data" exists
- The signer is the `payee`

### warnings

None.

### Results

An event is added to the extension state events array:

|  Property             |  Value                                   |
| --------------------- | -----------------------------------------|
| **name**              | Constant value: "declareReceivedRefund"  |
| **parameters**        |                                          |
| **parameters.amount** | `amount` from parameters                 |
| **parameters.note**   | `note` from parameters                   |
| **parameters.txHash** | `txHash` from parameters or undefined    |

---

## Interpretation

The proxy contract address is determined by the `request.currency.network` (see (table)[#Contract] with proxy contract addresses). Only transactions on this network are valid.

The sum of payment amounts minus the sum of refund amounts is considered the balance.

### Payments

Any ETH transaction to `paymentAddress` with exactly `last8Bytes(hash(requestId + salt + payment address))` in input data is considered a payment.

Any `declareReceivedPayment` event is considered a payment.

Any `TransferWithReference` events emitted from the proxy contract with the following arguments is considered a payment:

- `to === paymentAddress`
- `paymentReference === last8Bytes(hash(lowercase(requestId + salt + payment address)))`

### Refunds

Any ETH transaction to `refundAddress` with exactly `last8Bytes(hash(requestId + salt + refund address))` in input data is considered a refund.

Any `declareReceivedRefund` event is considered a refund.

Any `TransferWithReference` event emitted from the proxy contract with the following arguments is considered a refund:

- `to === refundAddress`
- `paymentReference === last8Bytes(hash(lowercase(requestId + salt + refund address)))`
