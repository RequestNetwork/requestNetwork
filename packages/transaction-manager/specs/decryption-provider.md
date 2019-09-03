# Decryption provider

This document specifies what is a decryption provider, how to use it and how to implement it in Request Network context.

## Requirement

It uses the Request Network Protocol concepts of `Identity` described in the [request logic specification](/packages/request-logic/specs/request-logic-specification-v2.0.0.md).

## Description

The decryption provider is an object in charge of decrypting encrypted data.
It hosts the keys used for decryption.
To not expose the keys, the decryption provider takes only the identities as parameters and not the keys itself.

## Functions and properties

### `supportedMethods`

This read-only property lists in an array all the encryption methods the decryption provider is able to decrypt.

Possible values: `'ecies'`

### `supportedIdentityTypes`

This read-only property lists in an array all the identity types the decryption provider supports.

Possible values: `'ethereumAddress'`

### `isIdentityRegistered()`

This function checks if it is possible to decrypt from a specific identity.

| Parameters   | Type     | Description       |
| ------------ | -------- | ----------------- |
| **identity** | Identity | Identity to check |

Returns: `true` if the identity is registered in the provider, `false` otherwise.

### `decrypt()`

This function is able to decrypt encrypted data with the methods listed in `supportedMethods` and for the identity types listed in `supportedIdentityTypes`

| Parameters   | Type     | Description                                              |
| ------------ | -------- | -------------------------------------------------------- |
| **data**     | string   | Encrypted data to decrypt                                |
| **identity** | Identity | Identity of the private key that will be used to decrypt |

Returns: The data decrypted in a `string`

Throws: The function must `throw` if:

- The data don't follow the request network multi-format
- The data are not encrypted in a supported method
- The identity type is not supported
- The provider doesn't have decryption key linked to the identity given
- The decryption failed for any reason
