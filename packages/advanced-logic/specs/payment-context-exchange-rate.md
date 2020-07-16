# Payment Context: Exchange rates

You can be interested in this document if you want to understand or implement how the network deals with payments 
in a different currency than the request currency.

Prerequisite: Having read the advanced logic specification (see [here](./advanced-logic-specs-0.1.0.md))

## Description

This extension describes how a request denominated in one currency should be paid in another currency.

When this extension exists, its currency overrides the request currency from a payment point of view.
The request denomination currency is used to compute the amount in another currency at the payment.

The typical scenario is a request denominated in fiat and paid in ERC20.

As a payment context, many triplets of oracle, currency and timeframe can be provided in order to describe:
* Before payment: what are the possible payment currencies and how to compute corresponding amounts
* After payment: how to compare payments in one currency with a balance in another currency

The version 0.1.0 is not designed to handle properly multiple payments, although it allows their detection
and to compute a balance that is very close to the one payers and payee expect.

## Properties

| Property                        | Type   | Description                                    | Requirement   |
|---------------------------------|--------|------------------------------------------------|---------------|
| **id**                          | String | constant value: "pc-exchange-rate"             | **Mandatory** |
| **type**                        | String | constant value: "paymentContext"               | **Mandatory** |
| **version**                     | String | constant value: "0.1.0"                        | **Mandatory** |
| **events**                      | Array  | List of the actions performed by the extension | **Mandatory** |
| **values**                      | Object |                                                |               |
| **values.paymentContextOption** | Array  | List of payment context options                | **Mandatory** |

### paymentContextOption

| Property             | Type     | Description                               | Requirement   |
| **values.oracle**    | String   | TODO:how can that be identified properly? | **Mandatory** |
| **values.timeframe** | Integer  | Exchange rate timespan                    | **Mandatory** |
| **values.currency**  | Currency | Currency of the expected amount           | **Mandatory** |

---

## Interpretation

When this extension is present at least once, the request payment should be made in one of the exchange rate
extensions currencies.

### To initiate a payment

The first step for payment initation is to pick one `values.currency` and its related exchange rate extension.
There should be a payment network for this currency bound to the request, to get required details.

For the selected currency, the payment processor should look at the exchange rate given by the `values.oracle`.
Once the exchange rate is fetched, the payment processor has a maximum `values.timeframe`to execute the payment, 
in seconds. The timeframe will be computed based on the payment transaction datetime, so the payment processor 
should anticipate network delays by adding a time margin.

### To detect payments

#### Standard case: one payment

The first step is to detect the payment as described in the payment network extensions.

If one payment is detected, we can compute an observed exchange rate, that we can compare to the oracle rate.
The observed rate should be between the minimum and maximum oracle exchange rate of the period:
`[paymentDateTime - values.timeframe, paymentDateTime]`.

#### Edge case: many payments

The extension v0.1.0 is not perfectly suited for many payments.

If several payments are detected, it is not possible to compute timeframe-based observed exchange rate as the 
value of the partial amount in request currency is unknown. If N payments are detected, the timeframe method can 
only be applied to the Nth payment.

For the (N-1) first payments, the only way is to compute the intermediate balances with the rate given by the oracle at
the exact payment moment.

If several payments are detected and the balance is less than the expected amount, the outstanding amount should
be calculated without the timeframe method. 

---

<!-- WIP TODO starting from here everything comes from content-data -->

## Actions

### Creation

#### Parameters

|                            | Type   | Description                         | Requirement   |
| -------------------------- | ------ | ----------------------------------- | ------------- |
| **id**                     | String | constant value: "content-data"      | **Mandatory** |
| **type**                   | String | constant value: "contentData"       | **Mandatory** |
| **version**                | String | constant value: "0.1.0"             | **Mandatory** |
| **parameters**             | Object |                                     |               |
| **parameters.contentData** | Object | Content data to link to the request | **Mandatory** |

#### Conditions

None.

#### Warnings

None.
TODO: somewhere define that you cannot link 2 pc for the same currency and the same request.

#### Results

A extension state is created with the following properties:

|  Property              |  Value                        |
| ---------------------- | ----------------------------- |
| **id**                 | "content-data"                |
| **type**               | "contentData"                 |
| **version**            | "0.1.0"                       |
| **values**             |                               |
| **values.contentData** | `contentData` from parameters |

---

### Updates

None.


