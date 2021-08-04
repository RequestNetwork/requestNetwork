# Additional interpretation for ERC20 Fee Proxy: smart escrow (WIP)

**TODO: These specifications are work in progress and might change a lot before they are fully supported by the library.**

Prerequisite: Payment Network "ERC20 With Fee" (see [here](./payment-network-erc20-fee-proxy-contract-0.1.0.md)).

## Description

This is an additional interpretation for the payment network "ERC20 With Fee", allowing the ERC20 payments to be locked on an escrow contract.

The payment is made beforehand to the smart escrow, which locks the funds. The payer can then unlock the funds for a certain target date, after which the request issuer can withdraw the funds. In case of collaboration conflict, the payer can also decide to freeze the payment, which triggers a one-year period freeze. After a freeze, only the payer can withdraw the funds.

The escrow contract pulls ERC20 tokens from the user, there should be no manual transfer.

The escrow contract relies on a proxy when funds are withdrawn. The proxy is responsible for sending `TransferWithReferenceAndFee` events and process the payment to the issuer.

The contract should only emit payment events when funds are unlocked or frozen by the payer.

## Contract

The equivalent of the contract function `transferFromWithReferenceAndFee` in ERC20 proxy is `lockWithReference` and it takes the same 6 arguments:

- `tokenAddress` is the address of the ERC20 contract
- `to` is the destination address for the tokens
- `amount` is the amount of tokens to transfer to the destination address
- `paymentReference` is the reference data used to track the transfer (see `paymentReference`)
- `feeAmount` is the amount of tokens to transfer to the fee destination address
- `feeAddress` is the destination address for the fee

The `LockWithReference` event is emitted when the tokens are locked. This event contains the same 6 arguments as the `transferFromWithReferenceAndFee` function.

| Network | Contract Address |
| ------- | ---------------- |
| Mainnet | TODO             |
| Rinkeby | TODO             |
| Private | TODO             |

## Interpretation

When a request is paid with escrow, the events `TransferWithReferenceAndFee` are interpreted the same way and from the same contract.

Additionally, `LockWithReferenceAndFee` and `LockFreeze` events can be used to compute a pre-payment balance.

Any `LockWithReferenceAndFee` events emitted by the escrow contract with the following arguments are considered as a pre-payment:

- `tokenAddress` `===` `request.currency.value`
- `to` `===` `paymentAddress`
- `paymentReference` `===` `last8Bytes(hash(lowercase(requestId + salt + payment address)))`

Any `LockFreeze` events emitted by the escrow contract with the following arguments are considered as a pre-payment freeze:

- `tokenAddress` `===` `request.currency.value`
- `paymentReference` `===` `last8Bytes(hash(lowercase(requestId + salt + refund address)))`

**The sum of pre-payment amounts minus the sum of pre-payment freeze amounts is considered the pre-payment balance.**
