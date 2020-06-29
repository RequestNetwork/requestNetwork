# Signature Provider

This document specifies what a Signature Provider is, how to use it and how to implement it in the Request Network context.

## Requirements

It uses the Request Network Protocol concepts of `Identity` and `Signature` described in the [request logic specification](https://github.com/RequestNetwork/requestNetwork/blob/development/packages/request-logic/specs/request-logic-specification-v2.0.1.md).

## Description

The signature provider is an object in charge of signing data. It's used to sign actions in the Request Network Protocol.

## Functions and Properties

### `supportedMethods`

This read-only property lists in an array all the signature methods the signature provider can use.

Possible values:

- `'ecdsa'`: Uses Elliptic Curve Digital Signature Algorithm to sign the data
- `'ecdsa-ethereum'`: Uses Elliptic Curve Digital Signature Algorithm, with [Ethereum padding](https://github.com/ethereum/go-ethereum/pull/2940), to sign the data (allowing data signature using Metamask)

### `supportedIdentityTypes`

This read-only property lists in an array all the identity types the signature provider supports.

Possible values: `'ethereumAddress'`

### `sign()`

This function is used to sign data with the methods listed in `supportedMethods` and for the identity types listed in `supportedIdentityTypes`.

| Parameter  | Type     | Description                         |
| ---------- | -------- | ----------------------------------- |
| **data**   | any      | The data to sign.                   |
| **signer** | Identity | The identity to sign the data with. |

Returns: A `SignedData` object containing the following properties:

| Property      | Type      | Description                                                              |
| ------------- | --------- | ------------------------------------------------------------------------ |
| **data**      | any       | The original data.                                                       |
| **signature** | Signature | The Signature object, containing the signature **method** and **value**. |

Throws: The function must `throw` if:

- The identity type is not supported.
- The provider doesn't have a private key linked to the identity given.
- The signature failed for any reason
