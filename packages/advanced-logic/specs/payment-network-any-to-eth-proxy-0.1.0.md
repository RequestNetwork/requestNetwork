# Payment Network - Any currency conversion to ETH with Fee

## Description

This extension allows the payments and the refunds to be made in ETH on Ethereum or native tokens on EVM blockchains for a request made in others currencies.
The rate is computed at the payment thanks to onchain oracles.
This Payment Network is quite similar to the [ETH Fee Proxy Contract](./payment-network-eth-fee-proxy-contract-0.1.0.md) extension, with a rate conversion before the payment.

The payment is made through a proxy contract. This proxy contract call the [ETH Fee Proxy Contract](./payment-network-eth-fee-proxy-contract-0.1.0.md) to do the ETH transfer on behalf of the user. The contract ensures a link between an ETH transfer and a request through a `paymentReference`.

This `paymentReference` consists of the last 8 bytes of a salted hash of the requestId: `last8Bytes(hash(lowercase(requestId + salt + address)))`:

The contract also ensures that the `feeAmount` amount of the ETH transfer will be forwarded to the `feeAddress`.

- `requestId` is the id of the request
- `salt` is a random number with at least 8 bytes of randomness. It must be unique to each request
- `address` is the payment address for payments, the refund address for refunds
- `feeAmount` is the amount of the transfer that should be paid in fees
- `feeAddress` is the address where the fee will be sent to
- `conversion path` is a list of currency hashes to perform the conversion
- `network` is the network of the tokens accepted for payments and refunds
- `maxRateTimespan` is the time span maximum accepted between the payment and the rate timestamp
- `lowercase()` transforms all characters to lowercase
- `hash()` is a keccak256 hash function
- `last8Bytes()` take the last 8 bytes

As a payment network, this extension allows to deduce a payment `balance` for the request. (see
[Interpretation](#Interpretation))

## Contract

The contract contains one function called `transferWithReferenceAndFee` which takes 6 arguments:

- `to` is the destination address for the tokens
- `requestAmount` is the amount to be paid in the request currency
- `path` is the conversion path from the request currency to the payment token (see `conversion path`)
- `paymentReference` is the reference data used to track the transfer (see `paymentReference`)
- `feeAmount` is the amount of fees to be paid in the request currency
- `feeAddress` is the destination address for the fee
- `maxRateTimespan` is the time span maximum accepted between the payment and the rate timestamp

The `TransferWithConversionAndReference` event is emitted when the tokens are transfered. This event contains:

- `amount` is the amount paid in the request currency
- `requestCurrency` is the request currency hash
- `paymentReference` is the reference data used to track the transfer (see `paymentReference`)
- `feeAmount` is the amount of fees to be paid in the request currency
- `maxRateTimespan` is the time span maximum given for the payment

[See smart contract source](https://github.com/RequestNetwork/requestNetwork/blob/master/packages/smart-contracts/src/contracts/EthConversionProxy.sol)

| Network | Contract Address                           |
| ------- | ------------------------------------------ |
| Mainnet | TODO                                       |
| Rinkeby | TODO                                       |
| Private | 0x8273e4B8ED6c78e252a9fCa5563Adfcc75C91b2A |

## Properties

| Property                  | Type   | Description                                                           | Requirement   |
| ------------------------- | ------ | --------------------------------------------------------------------- | ------------- |
| **id**                    | String | constant value: "pn-any-to-eth-proxy"                                 | **Mandatory** |
| **type**                  | String | constant value: "paymentNetwork"                                      | **Mandatory** |
| **version**               | String | constant value: "0.1.0"                                               | **Mandatory** |
| **events**                | Array  | List of the actions performed by the extension                        | **Mandatory** |
| **values**                | Object |                                                                       |               |
| **values.salt**           | String | Salt for the request                                                  | **Mandatory** |
| **values.paymentAddress** | String | Ethereum address for the payment                                      | Optional      |
| **values.refundAddress**  | String | Ethereum address for the refund                                       | Optional      |
| **values.feeAddress**     | String | Ethereum address for the fee payment                                  | Optional      |
| **values.feeAmount**      | String | The fee amount in the request `currency`                              | Optional      |
| **values.network**        | String | Ethereum network for the payments                                     | Optional      |
| **values.maxTimespan**    | Number | Time span maximum accepted between the payment and the rate timestamp | Optional      |

---

## Actions

### Creation

#### Parameters

|                               | Type   | Description                                                           | Requirement   |
| ----------------------------- | ------ | --------------------------------------------------------------------- | ------------- |
| **id**                        | String | Constant value: "pn-any-to-eth-proxy"          | **Mandatory** |
| **type**                      | String | Constant value: "paymentNetwork"                                      | **Mandatory** |
| **version**                   | String | Constant value: "0.1.0"                                               | **Mandatory** |
| **parameters**                | Object |                                                                       |               |
| **parameters.salt**           | String | Salt for the request                                                  | **Mandatory** |
| **parameters.paymentAddress** | String | Ethereum address for the payment                                      | Optional      |
| **parameters.refundAddress**  | String | Ethereum address for the refund                                       | Optional      |
| **parameters.feeAddress**         | String | Ethereum address for the fee payment                                  | Optional      |
| **parameters.feeAmount**      | String | The fee amount in the request `currency`                              | Optional      |
| **parameters.network**        | String | Ethereum network for the payments                                     | Optional      |
| **parameters.maxTimespan**    | Number | Time span maximum accepted between the payment and the rate timestamp | Optional      |

#### Conditions

This action is valid if:

- The `salt` is not empty and long enough (8 bytes of randomness minimum).

#### Warnings

This action must trigger the warnings:

| Warning                                 | Condition                                                   |
| --------------------------------------- | ----------------------------------------------------------- |
| "paymentAddress is given by the payer"  | If `signer` is the payer **and** `paymentAddress` is given  |
| "feeAddress is given by the payer"          | If `signer` is the payer **and** `feeAddress` is given          |
| "feeAmount is given by the payer"       | If `signer` is the payer **and** `feeAddress` is given          |
| "refundAddress is given by the payee"   | If `signer` is the payee **and** `refundAddress` is given   |

Note: These warnings are necessary to highlight to avoid attempts of fake payments and refunds. For example, a payer could create a request using as the payment address one of his own addresses. A system could interpret a transaction to this address as a payment while the payee did not receive the funds.

#### Results

An extension state is created with the following properties:

|  Property                 |  Value                                                         |
| ------------------------- | -------------------------------------------------------------- |
| **id**                    | "pn-any-to-eth-proxy"                   |
| **type**                  | "paymentNetwork"                                               |
| **version**               | "0.1.0"                                                        |
| **values**                |                                                                |
| **values.paymentAddress** | `paymentAddress` from parameters if given, undefined otherwise |
| **values.refundAddress**  | `refundAddress` from parameters if given, undefined otherwise  |
| **values.feeAddress**         | `feeAddress` from parameters if given, undefined otherwise         |
| **values.feeAmount**      | `feeAmount` from parameters if given, undefined otherwise      |
| **values.salt**           | Salt for the request                                           |
| **values.network**        | `network` from parameters if given, undefined otherwise        |
| **values.maxTimespan**    | `maxTimespan` from parameters if given, undefined otherwise    |
| **events**                | Array with one 'create' event (see below)                      |

the 'create' event:

|  Property                     |  Value                                                         |
| ----------------------------- | -------------------------------------------------------------- |
| **name**                      | 'create'                                                       |
| **parameters**                |                                                                |
| **parameters.paymentAddress** | `paymentAddress` from parameters if given, undefined otherwise |
| **parameters.refundAddress**  | `refundAddress` from parameters if given, undefined otherwise  |
| **parameters.feeAddress**     | `feeAddress` from parameters if given, undefined otherwise     |
| **parameters.feeAmount**      | `feeAmount` from parameters if given, undefined otherwise      |
| **values.network**            | `network` from parameters if given, undefined otherwise        |
| **values.maxTimespan**        | `maxTimespan` from parameters if given, undefined otherwise    |
| **parameters.salt**           | Salt for the request                                           |

---

### Updates

#### addPaymentAddress

##### Parameters

|                               | Type   | Description                                                  | Requirement   |
| ----------------------------- | ------ | ------------------------------------------------------------ | ------------- |
| **id**                        | String | Constant value: "pn-any-to-eth-proxy"                        | **Mandatory** |
| **action**                    | String | Constant value: "addPaymentAddress"                          | **Mandatory** |
| **parameters**                | Object |                                                              |               |
| **parameters.paymentAddress** | String | Ethereum address for the payment                             | **Mandatory** |

##### Conditions

This action is valid, if:

- The extension state with the id "pn-any-to-eth-proxy" exists
- The signer is the `payee`
- The extension property `paymentAddress` is undefined

##### Warnings

None.

##### Results

An extension state is updated with the following properties:

|  Property                 |  Value                                               |
| ------------------------- | ---------------------------------------------------- |
| **values.paymentAddress** | `paymentAddress` from parameters                     |
| **events**                | Add an 'paymentAddress' event (see below) at its end |

the 'addPaymentAddress' event:

|  Property                     |  Value                              |
| ----------------------------- | ----------------------------------- |
| **name**                      | Constant value: "addPaymentAddress" |
| **parameters**                |                                     |
| **parameters.paymentAddress** | `paymentAddress` from parameters    |

#### addRefundAddress

##### Parameters

|                              | Type   | Description                                                  | Requirement   |
| ---------------------------- | ------ | ------------------------------------------------------------ | ------------- |
| **id**                       | String | Constant value: "pn-any-to-eth-proxy"                        | **Mandatory** |
| **action**                   | String | Constant value: "addRefundAddress"                           | **Mandatory** |
| **parameters**               | Object |                                                              |               |
| **parameters.refundAddress** | String | Ethereum address for the refund                              | **Mandatory** |

##### Conditions

This action is valid if:

- The extension state with the id "pn-any-to-eth-proxy" exists
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

#### addFee

##### Parameters

|                          | Type   | Description                                                  | Requirement   |
| ------------------------ | ------ | ------------------------------------------------------------ | ------------- |
| **id**                   | String | Constant value: "pn-any-to-eth-proxy"                        | **Mandatory** |
| **action**               | String | Constant value: "addfeeAddress"                              | **Mandatory** |
| **parameters**           | Object |                                                              |               |
| **parameters.feeAddress**    | String | Ethereum address for the fee payment                     | **Mandatory** |
| **parameters.feeAmount** | String | The fee amount                                               | **Mandatory** |

##### Conditions

This action is valid, if:

- The extension state with the id "pn-any-to-eth-proxy" exists
- The signer is the `payee`
- The extension property `feeAddress` is undefined
- The extension property `feeAmount` is undefined or represents an integer greater or equal than zero

##### Warnings

None.

##### Results

An extension state is updated with the following properties:

|  Property            |  Value                                   |
| -------------------- | ---------------------------------------- |
| **values.feeAddress**    | `feeAddress` from parameters                 |
| **values.feeAmount** | `feeAmount` from parameters              |
| **events**           | Add a 'fee' event (see below) at its end |

the 'addFee' event:

|  Property                |  Value                      |
| ------------------------ | --------------------------- |
| **name**                 | Constant value: "addfeeAddress" |
| **parameters**           |                             |
| **parameters.feeAddress**    | `feeAddress` from parameters    |
| **parameters.feeAmount** | `feeAmount` from parameters |

---

## Interpretation

The fee proxy contract address is determined by the `paymentNetwork.values.network` (see (table)[#Contract] with proxy contract addresses).

Any `TransferWithConversionAndReference` events emitted from the proxy contract with the following arguments are considered as a payment:

- `to` `===` `paymentAddress`
- `paymentReference` `===` `last8Bytes(hash(lowercase(requestId + salt + payment address)))`
- `maxRateTimespan` `===` `paymentNetwork.values.maxRateTimespan`

Any `TransferWithConversionAndReference` events emitted from the proxy contract with the following arguments are considered as a refund:

- `to` `===` `refundAddress`
- `paymentReference` `===` `last8Bytes(hash(lowercase(requestId + salt + refund address)))`
- `maxRateTimespan` `===` `paymentNetwork.values.maxRateTimespan`

The sum of payment amounts minus the sum of refund amounts is considered the balance.

The fees amount can be be infered from the `TransferWithConversionAndReference` events emitted from the proxy contract.
