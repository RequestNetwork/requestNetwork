# Encryption

This document specifies how the encryption is done at the Transaction layer of Request Network.

- [Note](#note)
- [Requirement](#requirement)
- [Description](#description)
  - [Encrypted channel](#encrypted-channel)
  - [Encryption method](#encryption-method)
- [Functions](#functions)
  - [Create an encrypted channel](#create-an-encrypted-channel)
  - [Add encrypted data](#add-encrypted-data)
  - [Add new public keys](#add-new-public-keys)

## Note on hashes

A "normalized Keccak256 hash" of a JSON object is Keccak256 hash of an object which:

- the properties have been sorted alphabetically
- all the values and properties have been lowercased

## Requirement

The implementation must use a cryptographically strong random number generator method.

## Description

### Encrypted channel

An encrypted channel is a collection of encrypted data between several parties.
An encrypted channel is opened by one of the parties by creating and sharing one symmetric encryption key: the channel key.
When an encrypted channel is opened, each party can encrypt data with the same channel key.
Parties can be added on an encrypted channel by any other parties.

### Encryption method

The encryption uses:

- asymmetric Elliptic Curve Integrated Encryption Scheme (ECIES)
- symmetric AES-256-CBC encryption.

The data are first encrypted by AES-256 with a generated key.
This key is then encrypted for every other party with ECIES from their public key.
To not expose the public keys, the encrypted keys are indexed by the addresses.
The encrypted data, the encrypted keys and a hash of the data are pushed on chain.

## Functions

### Create an encrypted channel

| Property             | Type   | Description                                                                                                                  |
| -------------------- | ------ | ---------------------------------------------------------------------------------------------------------------------------- |
| **data**             | String | First encrypted data of the channel in base64                                                                                |
| **hash**             | String | Normalized Keccak256 hash of the message before encryption                                                                   |
| **keys**             | Object | AES-256 key encrypted with ECIES from the parties public keys, encoded in base64 and indexed by the hash of their identities |
| **encryptionMethod** | String | Encryption method use for the channel _('ECIES-AES256' here)_                                                                |

The data are encrypted with the algorithm AES-256 from the channel key generated for this channel.
The channel key generation must be cryptographically strong.
The encrypted data is stored in the format of a base64 string.

Example:

```JSON
{
  "data": "JOz9aOV1aYatMSAx+3CD9EyjNI/FwLp6DeA+AYk5ERnTDwwaETY7zz2NemubnGW7GGDATjSVsnCVWXuM58cihq1Bhkon2aiPHhQdpteEugkrM2Zx/kWrVlvRY8kyseB30hU7NhyiDUSLGOJ/Pmq3PjANbBi2svgADLFZ6SdYgwFkjxaO1XkvW/qvjuraFqW55/4wCd53yjWcjMcLzMgLYcTLmSns642xAjx0hAvwVPQmTVI5xOFf6PjbEN9qfRPfdQkaOuuGG2AYsVhOkSK73BULdIvx6PArfqICCtL23xmt4kCeFgd6HYQvSzSFqszqAWT1kJdiRj3sZXRtf6xcpeXDelBacHN+xD2mzdZlroVhlsjZi5s0mhemBd+C",
  "hash": "01865ea95812388a93162b560e01c5680f12966492dfbad8a9a104e1e79f6665fc",
  "keys":
   {
      "014e90cd5a599a1ac02d55d8af16655d4ae90d82642c6a8ef2fe2341a608053982": "aYOGYgtlt0JkBoKjxkMpoQJbE7GXtTT6JrjA+NF0Bd6BxDLyn5+hFIDvHltMkGS7rpzR3RyEnDl+SncDJ+cCxLo9Od7ntqGNVdin6n7EJqilmY0AmxJpAIAOnCwK5C46zH4RE0g7vBv/+3Gx2uFKw2Dfhpy7olQ5NL6Krsb2qEnmW32R3wmv85uCE88uxmcDlo/OrS36X+jzOye+/ZR+kOE=",
      "01f17f52151ebef6c7334fad080c5704d77216b732f6c7334fad08072117f341a6": "AKJaJONWml2moKwTGZCuXQMxBt014+6Sxo2rzXYBbgKV8peBo3RM6KrxvhIdnCtTwxu3CrlFrkfUm6VYoMsKPu5WhZMU1Wk2R+vYl7roJFCQsTqTN1Qkx0skBLhaSKwynzZY3BWyTZ5rf1+JPmi7g6fGB9VOUpv6EDlp9k1p2RZnsVc+fMYKMAWhMnSZ3gJQUVbHY2Jx0CiQX/N+PtpnTWM=",
    },
  "encryptionMethod": "ECIES-AES256-CBC"
}
```

### Add encrypted data

| Property | Type   | Description                                                |
| -------- | ------ | ---------------------------------------------------------- |
| **data** | String | Encrypted data in base64                                   |
| **hash** | String | Normalized Keccak256 hash of the message before encryption |

Example:

```JSON
{
    "data": "mBVy2ENb0Edkego5c9QXcFxszKxe7iQVE22wUPHMbrC7bBm99S238BAyACa1TBDlI4SajbrWM+/MG8CkBoph4FLTvh4PsUjhnfazFI9BnMtIMhdqDAoxXUSHsvnwbEFhllqwhFCWn6pslLNu7X7UJSDgj7nQ0t1IHegBSV7ZRqdOYw3UoxAEAyVOoUwMhr/sitF2AlgMSvKas5YCD47YIm6rDNmzyBn9Ed/fAxNojMXcg386khrPs37P6Q==",
    "hash": "018f94ee7e96fa65a761e8df9792af3f72fcf936f186fbb86881630f7d5333c8bb",
}
```

### Add new public keys

| Property | Type   | Description                                                                                       |
| -------- | ------ | ------------------------------------------------------------------------------------------------- |
| **keys** | Object | AES-256 key encrypted with ECIES from the new public keys indexed by the hash of their identities |

Example:

```JSON
{
    "keys": {
        "01c5fdf4076b8f3a5357c5e395ab970b5b54098fefa65a761e8df9792af3f398a": "OXdF4wZshE3+FM49ojErrgJIzqCx4r0DDj0bqof1yQJ7Kmz3zTaYh1xauD/Pq6HO1TJ3h+g4ca9DNzy2m2j7Q2RkqppeDkh4zsSyQ0eEN1dYLjfHqOisWelZ5l4hAH7+0LM8FHTCpKFJ1kSSHuALubYzbA+uO17eEr2dgzR3WaWDUhVn/uMYFwws3mHto41W4FWDGW+AWxIowhc3HrqsZRE=",
    }
}
```
