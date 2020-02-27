# @requestnetwork/payment-detection

`@requestnetwork/payment-detection` is a typescript library part of the [Request Network protocol](https://github.com/RequestNetwork/requestNetwork).
It contains client-side payment detection for all supported payment networks.

### Payment and Refund detections

If a payment network has been given to the request, the payment detection can be done.

From the information provided in payment network, the library will feed the property `balance` of the request with:

- `balance`: the sum of the amount of all payments minus the sum of amount of all refunds
- `events`: all the payments and refunds events with the amount, timestamp etc...

The payment networks available are:

- `Types.Payment.PAYMENT_NETWORK_ID.BITCOIN_ADDRESS_BASED` ('pn-bitcoin-address-based'): handle Bitcoin payments associated to a BTC address to the request, every transaction hitting this address will be consider as a payment. Optionally, the payer can provide a BTC address for the refunds. Note that **the addresses must be used only for one and only one request** otherwise one transaction will be considered as a payment for more than one request. (see [the specification](https://github.com/RequestNetwork/requestNetwork/blob/master/packages/advanced-logic/specs/payment-network-btc-address-based-0.1.0.md))
- `Types.Payment.PAYMENT_NETWORK_ID.TESTNET_BITCOIN_ADDRESS_BASED` ('pn-testnet-bitcoin-address-based'): Same as previous but for the bitcoin testnet (for test purpose)
- `Types.Payment.PAYMENT_NETWORK_ID.ERC20_ADDRESS_BASED`('pn-erc20-address-based'): Same as `BITCOIN_ADDRESS_BASED`, for ERC20 payments.
- `Types.Payment.PAYMENT_NETWORK_ID.ERC20_PROXY_CONTRACT`('pn-erc20-proxy-contract'): uses an intermediary contract to document which request is being paid, through the `PaymentReference`. (see [the specification](https://github.com/RequestNetwork/requestNetwork/blob/master/packages/advanced-logic/specs/payment-network-erc20-address-based-0.1.0.md))
- `Types.Payment.PAYMENT_NETWORK_ID.ETH_INPUT_DATA`('pn-eth-input-data'): uses the transaction input data to pass the `PaymentReference`. (see [the specification](https://github.com/RequestNetwork/requestNetwork/blob/master/packages/advanced-logic/specs/payment-network-eth-input-data-0.1.0.md))
- `Types.Payment.PAYMENT_NETWORK_ID.DECLARATIVE`('pn-any-declarative'): a manual alternative, where payer can declare a payment sent, and payee can declare it received, working for any currency. (see [the specification](https://github.com/RequestNetwork/requestNetwork/blob/master/packages/advanced-logic/specs/payment-network-any-declarative-0.1.0.md))
