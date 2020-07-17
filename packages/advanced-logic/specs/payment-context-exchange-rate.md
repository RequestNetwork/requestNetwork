# Payment Context: Exchange rates

You can be interested in this document if you want to understand or implement how the network deals with payments 
in a different currency than the request currency.

Prerequisite: Having read the advanced logic specification (see [here](./advanced-logic-specs-0.1.0.md))

## Description

This extension describes how to compute the due amount for a request denominated in one currency that should
be paid in another currency. The extension can be used to describe the exchange mechanisms for many possible 
currencies.

The typical scenario is a request denominated in fiat and paid in ERC20.

When this extension exists, it defines the **currencies that are accepted as a way to settle the request, 
overriding the request currency from that perspective.**

The exchange rate is expected to be calculated upon payment. The exchange rate is expected to fluctuate 
during the payment settlement, so the extension documents a rate timeframe validity.

As a payment context, many triplets of oracle, currency and timeframe can be provided in order to describe:
* Before payment: what are the possible payment currencies and how to compute corresponding amounts
* After payment: how to compare payments in one currency with a balance in another currency

The version 0.1.0 is not designed to properly support multiple payments, although it allows to compute a 
balance that is very close to the one payer and payee expect.

## Properties

| Property                         | Type   | Description                                    | Requirement   |
|----------------------------------|--------|------------------------------------------------|---------------|
| **id**                           | String | constant value: "pc-exchange-rate"             | **Mandatory** |
| **type**                         | String | constant value: "paymentContext"               | **Mandatory** |
| **version**                      | String | constant value: "0.1.0"                        | **Mandatory** |
| **values**                       | Object |                                                |               |
| **values.paymentContextOptions** | Array  | List of payment context options                | **Mandatory** |

### paymentContextOption

Each payment context option describes the timeframe and oracle that should be used to compute the exchange 
rate between the request currency and the option currency.

| Property      | Type      | Description                                    | Requirement   |
|---------------|-----------|------------------------------------------------|---------------|
| **oracle**    | String    | Precise identifier, such as the oracle API URL | **Mandatory** |
| **timeframe** | Integer   | Exchange rate timespan in seconds              | **Mandatory** |
| **currency**  | ICurrency | Currency of the expected amount                | **Mandatory** |

---

## Interpretation

When this extension is present, payments in the request payment should be ignored.

### To initiate a payment

The first step for payment initation is to pick one `values.paymentContextOptions.currency`, and its related
`oracle` and `timeframe`.
There should be a payment network for this `currency` bound to the request, describing the payment details.

For the selected `currency`, a payment processor should look at the exchange rate given by the `oracle`.
Once the exchange rate is fetched, the payment processor has a maximum `timeframe`to execute the payment, 
in seconds. The timeframe will determine the exchange rate and payment validity based on the payment transaction 
datetime, so payment processors should anticipate network delays by adding a time margin.

### To detect payments

#### Standard case: one payment

The first step is to detect the payment as described in the payment network extension.

If one payment is detected, we can compute an *observed exchange rate*, that we can compare to the oracle rate.
The *observed rate* should be between the minimum and maximum oracle exchange rate of the period:
`[paymentDateTime - values.timeframe, paymentDateTime]`.

If the *observed exchange rate* is outside of the oracle exchange rate range, and if that lets the request 
under-paid, payment processors should compute the due payment by considering the exchange rate given by the 
`oracle` at the exact payment date and time.

#### Edge case: many payments

The extension v0.1.0 is not perfectly suited for many payments.

If several payments are detected, it is not possible to compute timeframe-based observed exchange rate as the 
value of the partial amount in request currency is unknown. If N payments are detected, the timeframe method can 
only be applied to the Nth payment.

For the (N-1) first payments, the only way is to compute the intermediate balances with the rate given by the oracle 
at the exact payment moment.

After a partial payment, or if many partial payments do not add up to the expected amount, the outstanding amount 
should be calculated without the timeframe method.

---

## Actions

### Creation

#### Parameters

| Property                             | Type   | Description                        | Requirement   |
|--------------------------------------|--------|------------------------------------|---------------|
| **id**                               | String | constant value: "pc-exchange-rate" | **Mandatory** |
| **type**                             | String | constant value: "paymentContext"   | **Mandatory** |
| **version**                          | String | constant value: "0.1.0"            | **Mandatory** |
| **parameters**                       | Object |                                    |               |
| **parameters.paymentContextOptions** | Array  | List of payment context options    | **Mandatory** |

#### Conditions

There should be only one way to convert a currency into the request currency, so one cannot add a second payment context
option for a currency exchange already described. Only conflicting exchange options are ignored from the extension.

#### Warnings

None.

#### Results

The interpretation of a Creation action should create this extension state:

|| Property                         | Value                                                                 |
|----------------------------------|-----------------------------------------------------------------------|
| **id**                           | "pc-exchange-rate"                                                    |
| **type**                         | "paymentContext"                                                      |
| **version**                      | "0.1.0"                                                               |
| **values**                       |                                                                       |
| **values.paymentContextOptions** | `paymentContextOptions` from parameters if given and under conditions |

---

### Updates

None.


