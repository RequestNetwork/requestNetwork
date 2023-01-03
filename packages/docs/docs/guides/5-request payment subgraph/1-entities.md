---
title: Subgraph Entities
keywords: [Subgraph, Entities, Schema]
description: Subgraph entities and descriptions.
---

## Entities

- [`Payment`](#payment)
- [`Escrow`](#escrow)
- [`EscrowEvent`](#escrowevent)

## Payment

Description: get specific details of the payment

| Field             | Type        | Description                                      |
| ----------------- | ----------- | ------------------------------------------------ |
| id                | ID!         | hash transaction of the payment                  |
| contractAddress   | Bytes!      | payment proxy contract address                   |
| tokenAddress      | Bytes       | contract of token used for payment               |
| to                | Bytes!      | address payment was made to                      |
| from              | Bytes!      | address payment was made from                    |
| reference         | Bytes!      | is the reference data used to track the transfer |
| block             | Int!        | block payment took place                         |
| timestamp         | Int!        | time stamp of payment                            |
| txHash            | Bytes!      | transaction hash of payment                      |
| gasUsed           | BigInt!     | gas used for payment                             |
| gasPrice          | BigInt!     | gas fee at time of payment                       |
| amount            | BigDecimal! | amount of payment                                |
| feeAmount         | BigDecimal  | fee charged for payment                          |
| feeAddress        | Bytes       | address where the fee is sent                    |
| currency          | Bytes       | fiat currency payment is based on                |
| amountInCrypto    | BigDecimal  | amount of payment in crypto                      |
| feeAmountInCrypto | BigDecimal  | fee amount in crypto                             |
| maxRateTimespan   | Int         | maximum time span payment will reoccur           |

## Escrow

Description: It acts like a transparent, safe deposit box which automatically disburses the funds held inside when both parties agree that the contract has been satisfied.

| Field               | Type                           | Description                                    |
| ------------------- | ------------------------------ | ---------------------------------------------- |
| id                  | ID!                            | hash transaction of the escrow                 |
| contractAddress     | Bytes!                         | escrow contract address                        |
| paymentProxyAddress | Bytes                          | payment proxy contract address                 |
| reference           | Bytes!                         | is the reference data used to track the escrow |
| creationBlock       | Int!                           | block escrow was created                       |
| creationTimestamp   | Int!                           | time stamp escrow was created                  |
| escrowState         | EscrowState!                   | state of the escrow                            |
| tokenAddress        | Bytes!                         | contract of token used for payment             |
| amount              | BigDecimal!                    | amount of escrow set up                        |
| feeAmount           | BigDecimal!                    | fee charged for escrow                         |
| feeAddress          | Bytes!                         | address where fees are sent                    |
| from                | Bytes!                         | address escrow is set up from                  |
| to                  | Bytes                          | address escrow is paid to                      |
| events              | [`EscrowEvent!`](#escrowevent) | refer to Escrow Event                          |

## EscrowEvent

Description: get specific details of the Escrow Event

| Field           | Type       | Description                                          |
| --------------- | ---------- | ---------------------------------------------------- |
| id              | ID!        | hash transaction of the escrow                       |
| contractAddress | Bytes!     | escrow contract address                              |
| reference       | Bytes!     | reference data used to track the escrow event |
| escrow          | Escrow!    | the Escrow where this event occurred                 |
| block           | Int!       | block in which event took place                      |
| timestamp       | Int!       | timestamp of event                                   |
| txHash          | Bytes!     | transaction hash of escrow event                     |
| eventName       | EventName! | name of the escrow event                             |
| from            | Bytes!     | address escrow is set up from                        |
| gasUsed         | BigInt!    | gas used for event                                   |
| gasPrice        | BigInt!    | price of gas at time of event                        |
