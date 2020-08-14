# Payment Networks

You may be interested in this document if:

- you want to create your own implementation of the Request protocol
- you want to understand how a request's payment status is calculated

Prerequisite: Having read the advanced logic specification (see [here](./advanced-logic-specs-0.1.0.md)).

The request logic layer describes how network peers exchange payment requests and document their details and workflow.

As parts of the workflow, **payment networks are described as extensions** and should be used for every request. They describe how the issuer and payer agree on the request payment completion, by detailing **how payments and refunds should be made**. 

If the payment network allows payments and refunds in a currencies that are different from the request currency, they should describe how payments and refunds can be converted in the request currency.

Payment networks can document different payment completion consensuses:

- Declarative: payer and issuer validate the emission and reception of a payment
- Automatic: the issuer describes the detection criteria (e.g. funds received on a specific address or transaction with an identifier)

For automatic payment networks, the status is never stored. Request network clients should compute the payment status every time.

# Balance computation

The request `balance` is the amount that has been paid and detected in a way that meets the payment networks requirements in their latest states. Reminder: the latest state is computed by applying to the extension all the extension actions matching the conditions listed in the extension specifications. Actions with warning are taken into account, but the warning should be transmitted to users.

If a request has several payment networks, we should consider the complete set of payments and refunds, each described by one payment network.

If a request has no payment network, its `balance` is zero.

If a request has no payment meeting the payment network requirements, its `balance` is zero.

## Basic balance computation

When we can detect payments and/or refunds the `balance` is computed with these steps:

- Initial `balance` is 0
- Add all incoming payments to the `balance`
- Deduce all refunds from the `balance`

## Payment status

The payment status is `paid` if `balance >= expectedAmount`
The payment status is `pending` otherwise.

## Conditions

We have to add a new condition to the [cancellation event from the Request logic](../../request-logic/specs/request-logic-specification.md#Cancel)

The cancellation is only valid if the `balance` is 0 at the time of the cancellation. (see [here](../../advanced-logic/specs/payment-networks-0.1.0.md))

## Warnings

| Warning                     | Condition                                                                                         |
|-----------------------------|---------------------------------------------------------------------------------------------------|
| "Paid a cancelled request"  | if the payer pays after he declined of after the issuer cancelled                                 |
| "Overpaid a request"        | if the payer paid too much                                                                        |
| "Payment network conflicts" | if one tries to add a payment network having overlapping criteria with an exiting payment network |
