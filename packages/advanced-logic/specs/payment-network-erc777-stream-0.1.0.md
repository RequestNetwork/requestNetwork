# Payment Network - ERC777 Stream

## Description

This extension allows payments to be made with streams of ERC777 Super tokens (cf. Superfluid Finance).
This payment network inherits from the [ERC20 Fee Proxy Contract](./payment-network-erc20-proxy-contract-0.1.0.md) extension.

Many requests can be paid with the same stream, typically recurring requests of fix amount paid continuously. A group of requests payable with the same stream are called a request series, they must all have the same currency. It is possible to pay one series of requests with many streams, but it is not the purpose.

There are 2 kinds of request extensions in order to accept ERC777:

- The first request of a series is very similar to [payment-network-erc20-fee-proxy](./payment-network-erc20-fee-proxy-contract-0.1.0.md), it defines the salt, paymentAddress and requestId to compute the `paymentReference` used for the whole series.
- Other requests must define a `previousRequestId` and cannot redefine any of the payment properties (`paymentAddress`, `feeAddress` or `salt`).

This version 0.1.0 does not allow refunds to be streamed. Refunds have to be made according to [payment-network-erc20-fee-proxy](./payment-network-erc20-fee-proxy-contract-0.1.0.md), using the fact that ERC777 tokens implement the ERC20 interface.

?? remaining questions ??

- impact on reputation
- flow rate < invoicing rate ?

As for [ERC20 Fee Proxy Contract](./payment-network-erc20-proxy-contract-0.1.0.md) requests, the request issuer can also declare payments manually. Fees shall not be paid for declarative payments.

The SuperApp contract does the ERC777 token stream on behalf of the user. The contract ensures a link between an ERC777 SuperFluid stream and a request through a `paymentReference` stored in the userdata of the incoming stream. This `paymentReference` consists of the last 8 bytes of a salted hash of the requestId: `last8Bytes(hash(lowercase(requestId + salt + address)))`:

As a payment network, this extension describes how to deduce a payment `balance` for the request. (see [Interpretation](#Interpretation))

## Payment SuperApp Contract

The contract contains one function called `streamFromWithReferenceAndFee` which takes 6 arguments:

- `tokenAddress` is the address of the ERC777 contract
- `to` is the destination address for the tokens
- `amount` is the amount of tokens to stream to the destination address
- `paymentReference` is the reference data used to track the stream (see `paymentReference`)
- `feeAmount` is the amount of tokens to stream to the fee destination address
- `feeAddress` is the destination address for the fee

The `StreamWithReferenceAndFee` event is emitted when the tokens are streamed. This event contains the same 6 arguments as the `streamFromWithReferenceAndFee` function.

[See smart contract source](https://github.com/RequestNetwork/requestNetwork/blob/master/packages/smart-contracts/src/contracts/ERC777FeeSuperApp.sol)

| Network | Superhost Address                          |
| ------- | ------------------------------------------ |
| Private | FIXME                                      |
| matic   | 0x1EB3FAA360bF1f093F5A18d21f21f13D769d044A |
| xDai    | 0x8e8F05f1aD16D20e66Bd0922b510332104ddAc7B |

## Manual payment declaration

Manual payment declarations follow the same specifications as [payment-network-erc20-fee-proxy](./payment-network-erc20-fee-proxy-contract-0.1.0.md).

## Properties

### First request of a series

| Property                  | Type   | Description                                    | Requirement   |
| ------------------------- | ------ | ---------------------------------------------- | ------------- |
| **id**                    | String | constant value: "pn-erc777-fee-superfluid"     | **Mandatory** |
| **type**                  | String | constant value: "paymentNetwork"               | **Mandatory** |
| **version**               | String | constant value: "0.1.0"                        | **Mandatory** |
| **events**                | Array  | List of the actions performed by the extension | **Mandatory** |
| **values**                | Object |                                                |               |
| **values.salt**           | String | Salt for the request                           | **Mandatory** |
| **values.paymentAddress** | String | Blockchain address for the payment             | Optional      |
| **values.refundAddress**  | String | Blockchain address for the refund              | Optional      |
| **values.feeAddress**     | String | Blockchain address for the fee payment         | Optional      |
| **values.feeAmount**      | String | The fee amount in the request `currency`       | Optional      |

### Following requests of a series

| Property                     | Type   | Description                                     | Requirement   |
| ---------------------------- | ------ | ----------------------------------------------- | ------------- |
| **id**                       | String | constant value: "pn-erc777-fee-superfluid"      | **Mandatory** |
| **type**                     | String | constant value: "paymentNetwork"                | **Mandatory** |
| **version**                  | String | constant value: "0.1.0"                         | **Mandatory** |
| **events**                   | Array  | List of the actions performed by the extension  | **Mandatory** |
| **values**                   | Object |                                                 |               |
| **values.previousRequestId** | String | requestId of the previous request in the series | **Mandatory** |

---

## Action: Creation of the first request of a series

### Parameters

|                               | Type   | Description                                | Requirement   |
| ----------------------------- | ------ | ------------------------------------------ | ------------- |
| **id**                        | String | Constant value: "pn-erc777-fee-superfluid" | **Mandatory** |
| **type**                      | String | Constant value: "paymentNetwork"           | **Mandatory** |
| **version**                   | String | Constant value: "0.1.0"                    | **Mandatory** |
| **parameters**                | Object |                                            |               |
| **parameters.salt**           | String | Salt for the request                       | **Mandatory** |
| **parameters.paymentAddress** | String | Blockchain address for the payment         | Optional      |
| **parameters.refundAddress**  | String | Blockchain address for the refund          | Optional      |
| **parameters.feeAddress**     | String | Blockchain address for the fee payment     | Optional      |
| **parameters.feeAmount**      | String | The fee amount in the request `currency`   | Optional      |

### Conditions

This action is valid if:

- The `salt` is not empty and long enough (8 bytes of randomness minimum).
- The `currency.type` is ERC777.

### Warnings

This action must trigger the same warnings as a normal ERC20 Fee Proxy extension creation, inherited from [payment-network-erc20-fee-proxy](./payment-network-erc20-fee-proxy-contract-0.1.0.md).

### Results

The extension state is created with the following properties:

|  Property                 |  Value                                                         |
| ------------------------- | -------------------------------------------------------------- |
| **id**                    | "pn-erc777-fee-superfluid"                                     |
| **type**                  | "paymentNetwork"                                               |
| **version**               | "0.1.0"                                                        |
| **values**                |                                                                |
| **values.paymentAddress** | `paymentAddress` from parameters if given, undefined otherwise |
| **values.refundAddress**  | `refundAddress` from parameters if given, undefined otherwise  |
| **values.feeAddress**     | `feeAddress` from parameters if given, undefined otherwise     |
| **values.feeAmount**      | `feeAmount` from parameters if given, undefined otherwise      |
| **values.salt**           | Salt for the request                                           |
| **events**                | Array with one 'create' event (see below)                      |

The 'create' event in the extension state **events**:

|  Property      |  Value                                               |
| -------------- | ---------------------------------------------------- |
| **name**       | 'create'                                             |
| **parameters** | the parameters object with possible undefined values |

## Action: Creation of children requests in a series

### Parameters

|                                  | Type   | Description                                          | Requirement   |
| -------------------------------- | ------ | ---------------------------------------------------- | ------------- |
| **id**                           | String | Constant value: "pn-erc777-fee-superfluid"           | **Mandatory** |
| **type**                         | String | Constant value: "paymentNetwork"                     | **Mandatory** |
| **version**                      | String | Constant value: "0.1.0"                              | **Mandatory** |
| **parameters**                   | Object |                                                      |               |
| **parameters.previousRequestid** | String | RequestId of the previous request in the same series | **Mandatory** |

### Conditions

This action is valid if:

- The `previousRequestid` is not empty and references an existing request with the same `currency`
- No request created before references the same request (there cannot be siblings)

### Results

The extension state is created with the following properties:

|  Property                    |  Value                                               |
| ---------------------------- | ---------------------------------------------------- | ------------- |
| **id**                       | "pn-erc777-fee-superfluid"                           |
| **type**                     | "paymentNetwork"                                     |
| **version**                  | "0.1.0"                                              |
| **values**                   |                                                      |
| **values.previousRequestid** | RequestId of the previous request in the same series | **Mandatory** |
| **events**                   | Array with one 'create' event (see below)            |

The 'create' event in the extension state **events**:

|  Property      |  Value                |
| -------------- | --------------------- |
| **name**       | 'create'              |
| **parameters** | the parameters object |

---

## Action: addPaymentAddress

### Parameters

|                               | Type   | Description                                | Requirement   |
| ----------------------------- | ------ | ------------------------------------------ | ------------- |
| **id**                        | String | Constant value: "pn-erc777-fee-superfluid" | **Mandatory** |
| **action**                    | String | Constant value: "addPaymentAddress"        | **Mandatory** |
| **parameters**                | Object |                                            |               |
| **parameters.paymentAddress** | String | Blockchain address for the payment         | **Mandatory** |

### Conditions

This action is valid, if:

- The extension state with the id "pn-erc777-fee-superfluid" exists
- The signer is the `payee`
- The extension value `previousRequestId` does not exist
- The extension value `paymentAddress` is undefined

### warnings

None.

### Results

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

## Action: addRefundAddress

### Parameters

|                              | Type   | Description                                | Requirement   |
| ---------------------------- | ------ | ------------------------------------------ | ------------- |
| **id**                       | String | Constant value: "pn-erc777-fee-superfluid" | **Mandatory** |
| **action**                   | String | Constant value: "addRefundAddress"         | **Mandatory** |
| **parameters**               | Object |                                            |               |
| **parameters.refundAddress** | String | Blockchain address for the refund          | **Mandatory** |

### Conditions

This action is valid if:

- The extension state with the id "pn-erc777-fee-superfluid" exists
- The signer is the `payer`
- The extension value `previousRequestId` does not exist
- The extension value `refundAddress` is undefined

### warnings

None.

### Results

The extension state is updated with the following properties:

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

## Action: addFee

### Parameters

|                           | Type   | Description                                | Requirement   |
| ------------------------- | ------ | ------------------------------------------ | ------------- |
| **id**                    | String | Constant value: "pn-erc777-fee-superfluid" | **Mandatory** |
| **action**                | String | Constant value: "addFeeAddress"            | **Mandatory** |
| **parameters**            | Object |                                            |               |
| **parameters.feeAddress** | String | Blockchain address for the fee payment     | **Mandatory** |
| **parameters.feeAmount**  | String | The fee amount                             | **Mandatory** |

### Conditions

This action is valid, if:

- The extension state with the id "pn-erc777-fee-superfluid" exists
- The signer is the `payee`
- The extension value `previousRequestId` does not exist
- The extension value `feeAddress` is undefined
- The extension value `feeAmount` is undefined or represents an integer greater or equal than zero

### warnings

None.

### Results

The extension state is updated with the following properties:

|  Property             |  Value                                   |
| --------------------- | ---------------------------------------- |
| **values.feeAddress** | `feeAddress` from parameters             |
| **values.feeAmount**  | `feeAmount` from parameters              |
| **events**            | Add a 'fee' event (see below) at its end |

the 'addFee' event:

|  Property                 |  Value                          |
| ------------------------- | ------------------------------- |
| **name**                  | Constant value: "addFeeAddress" |
| **parameters**            |                                 |
| **parameters.feeAddress** | `feeAddress` from parameters    |
| **parameters.feeAmount**  | `feeAmount` from parameters     |

## Action: declareReceivedPayment TODO : assign to request or to suite?

### Parameters

|                        | Type   | Description                                                   | Requirement   |
| ---------------------- | ------ | ------------------------------------------------------------- | ------------- |
| **id**                 | String | Constant value: "pn-erc777-fee-superfluid"                    | **Mandatory** |
| **action**             | String | Constant value: "declareReceivedPayment"                      | **Mandatory** |
| **parameters**         | Object |                                                               |               |
| **parameters.amount**  | Amount | The amount declared as received, in request currency          | **Mandatory** |
| **parameters.note**    | String | Additional information about the payment                      | Optional      |
| **parameters.txHash**  | String | The transaction hash for documentation and metadata           | Optional      |
| **parameters.network** | String | The network of the transaction for documentation and metadata | Optional      |

### Conditions

This action is valid, if:

- The extension state with the id "pn-erc777-fee-superfluid" exists
- The signer is the `payee`

### warnings

None.

### Results

An event is added to the extension state events array:

|  Property             |  Value                                   |
| --------------------- | ---------------------------------------- |
| **name**              | Constant value: "declareReceivedPayment" |
| **parameters**        |                                          |
| **parameters.amount** | `amount` from parameters                 |
| **parameters.note**   | `note` from parameters                   |
| **parameters.txHash** | `txHash` from parameters or undefined    |

## Action: declareReceivedRefund TODO : assign to request or to suite?

### Parameters

|                        | Type   | Description                                                   | Requirement   |
| ---------------------- | ------ | ------------------------------------------------------------- | ------------- |
| **id**                 | String | Constant value: "pn-erc777-fee-superfluid"                    | **Mandatory** |
| **action**             | String | Constant value: "declareReceivedRefund"                       | **Mandatory** |
| **parameters**         | Object |                                                               |               |
| **parameters.amount**  | Amount | The amount declared as received, in request currency          | **Mandatory** |
| **parameters.note**    | String | Additional information about the payment                      | Optional      |
| **parameters.txHash**  | String | The transaction hash for documentation and metadata           | Optional      |
| **parameters.network** | String | The network of the transaction for documentation and metadata | Optional      |

### Conditions

This action is valid, if:

- The extension state with the id "pn-erc777-fee-superfluid" exists
- The signer is the `payee`

### warnings

None.

### Results

An event is added to the extension state events array:

|  Property              |  Value                                  |
| ---------------------- | --------------------------------------- |
| **name**               | Constant value: "declareReceivedRefund" |
| **parameters**         |                                         |
| **parameters.amount**  | `amount` from parameters                |
| **parameters.note**    | `note` from parameters                  |
| **parameters.txHash**  | `txHash` from parameters or undefined   |
| **parameters.network** | `network` from parameters or undefined  |

---

## Interpretation

### Fluctuating balance

The balance of an ongoing payment flow changes every second. Hence, to compute a balance that keeps in sync, the advanced-logic returns:

- `lastUpdatedBalance`
- `lastUpdateTimestamp`
- `currentFlowRate`

We can only use the suite balance as a fixed number if the flow rate is zero.

Similarly, a request balance is a fixed number if it is paid or if the flow rate is zero.

### Suite balance and request balance

All the requests within the same suite use the same `paymentReference` for balance updates. In order to compute a request balance, we need to know all the preceeding requests it in the series. The serie balance is allocated to requests one by one, starting by the first, and up to each `expectedAmount`. We repeat that process up to the current request if possible. If the suite balance is high enough to allocate funds up to the current request, the balance is strictly positive. If the remaining allocated balance falls down to zero before the allocation process reached current request, its balance is zero.

The balance of one request cannot be greater than its expected amount except if we know that there is no more subsequent request in the series. Said another way: only the last request of the series can be overpaid.

In edge case scenarios, a new request is added to the end of the suite after an overpayment. The formerly last request becomes second to last, its balance is reduced to its `expectedAmount` and the remaining balance is allocated to the new request. Said another way: we can pay a suite before it is fully created, and the overpayment status of a suite can be temporary.

### Events

Three types of events have to be interpreted for the suite balance update:

- `FlowUpdated` when payment flows are created, updated or stopped, with agreements "Instant Distribution Agreement" or "Constant Flow Agreement"
- ERC20 payments and refunds: inheriting from (payment-network-erc20-fee-proxy)[(./payment-network-erc20-fee-proxy-contract-0.1.0.md)]
- Manual payment and refund declarations

The SuperApp contract address is determined by the `request.currency.network` (see (table)[#Contract] with SuperApp contract addresses.

#### Main payment flows

`FlowUpdated` events emmitted by the SuperHost with the userData object matching following conditions must be interpreted as payments:

- `callData.address === values.paymentAddress`
- `userData.paymentReference === last8Bytes(hash(lowercase(requestId + salt + values.paymentAddress)))`

#### Fee payment flows

`FlowUpdated` events emmitted by the SuperHost with the userData object matching following conditions must be interpreted as fee payments:

- `callData.address === values.feeAddress`
- `userData.paymentReference === last8Bytes(hash(lowercase(requestId + salt + values.paymentAddress)))`

### A - Computing the suite balance

1. Gather `FlowUpdated` events with the criteria **Main payment flows**, sort them by date. => These are `paymentFlows`
2. Compute the sum up to the most recent payment flow (flow rate \* flow timespan for finished timespans) => This is the `lastUpdatedFlowBalance`
3. Substract from the `lastUpdatedFlowBalance` the sum of detected refunds and the sum of declared received refunds, add the sum of declared received payments => This is the `lastUpdatedBalance`
4. The most recent flow update transaction timestamp is the `lastUpdateTimestamp`
5. The most recent flow update `flowRate` is the `currentFlowRate`

### B - Computing a request balance

1. Sum up the `expectedAmount` of all previous requests => `sumOfPreviousExpectedAmount`
2. If `sumOfPreviousExpectedAmount + expectedAmount <= lastUpdatedBalance` and the request is not the last one of the suite, we can interpret `requestBalance = expectedAmount`
3. If `currentFlowRate == 0`, we can compute a request balance with `lastUpdatedBalance - sumOfPreviousExpectedAmount` if it is positive, `zero` otherwise, and capping this value to `expectedAmount` if the request is not the last one of its series
4. If `currentFlowRate > 0`, we cannot compute a fix request balance. Each second, we need to apply the logic above replacing `lastUpdatedBalance` with `lastUpdatedBalance + currentFlowRate \* (current timestamp - lastUpdateTimestamp)`

### C - Computing fee balances

Apply exactly the same steps from A and B but:

- adapting the flow filter to fetch fee flows (cf. Fee payment flows)
- and replacing `expectedAmount` with `values.feeAmount` coming from the first request of the suite
