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

## Note on addresses

"Addresses" refer here to the rightmost 20 bytes of the Keccak-256 hash of the public key (like Ethereum addresses).
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
- symmetric AES-256 encryption.

The data are first encrypted by AES-256 with a generated key.
This key is then encrypted for every other party with ECIES from their public key.
To not expose the public keys, the encrypted keys are indexed by the addresses.
The encrypted data, the encrypted keys and a hash of the data are pushed on chain.

## Functions

### Create an encrypted channel

| Property             | Type   | Description                                                                                                     |
| -------------------- | ------ | --------------------------------------------------------------------------------------------------------------- |
| **encryptedData**    | String | First encrypted data of the channel in base64                                                                   |
| **hash**             | String | Normalized Keccak256 hash of the message before encryption                                                      |
| **keys**             | Object | AES-256 key encrypted with ECIES from the parties public keys, encoded in base64 and indexed by their addresses |
| **encryptionMethod** | String | Encryption method use for the channel _('ECIES-AES256' here)_                                                   |

The data are encrypted with the algorithm AES-256 from the channel key generated for this channel.
The channel key generation must be cryptographically strong.
The encrypted data is stored in the format of a base64 string.

Example:

```JSON
{
  "encryptedData": "JOz9aOV1aYatMSAx+3CD9EyjNI/FwLp6DeA+AYk5ERnTDwwaETY7zz2NemubnGW7GGDATjSVsnCVWXuM58cihq1Bhkon2aiPHhQdpteEugkrM2Zx/kWrVlvRY8kyseB30hU7NhyiDUSLGOJ/Pmq3PjANbBi2svgADLFZ6SdYgwFkjxaO1XkvW/qvjuraFqW55/4wCd53yjWcjMcLzMgLYcTLmSns642xAjx0hAvwVPQmTVI5xOFf6PjbEN9qfRPfdQkaOuuGG2AYsVhOkSK73BULdIvx6PArfqICCtL23xmt4kCeFgd6HYQvSzSFqszqAWT1kJdiRj3sZXRtf6xcpeXDelBacHN+xD2mzdZlroVhlsjZi5s0mhemBd+C",
  "hash": "0x865ea95812388a93162b560e01c5680f12966492dfbad8a9a104e1e79f6665fc",
  "keys":
   {
      "0x627306090abab3a6e1400e9345bc60c78a8bef57": "aYOGYgtlt0JkBoKjxkMpoQJbE7GXtTT6JrjA+NF0Bd6BxDLyn5+hFIDvHltMkGS7rpzR3RyEnDl+SncDJ+cCxLo9Od7ntqGNVdin6n7EJqilmY0AmxJpAIAOnCwK5C46zH4RE0g7vBv/+3Gx2uFKw2Dfhpy7olQ5NL6Krsb2qEnmW32R3wmv85uCE88uxmcDlo/OrS36X+jzOye+/ZR+kOE=",
      "0xf17f52151ebef6c7334fad080c5704d77216b732": "AKJaJONWml2moKwTGZCuXQMxBt014+6Sxo2rzXYBbgKV8peBo3RM6KrxvhIdnCtTwxu3CrlFrkfUm6VYoMsKPu5WhZMU1Wk2R+vYl7roJFCQsTqTN1Qkx0skBLhaSKwynzZY3BWyTZ5rf1+JPmi7g6fGB9VOUpv6EDlp9k1p2RZnsVc+fMYKMAWhMnSZ3gJQUVbHY2Jx0CiQX/N+PtpnTWM=",
    },
  "encryptionMethod": "ECIES-AES256"
}
```

### Add encrypted data

| Property          | Type   | Description                                                           |
| ----------------- | ------ | --------------------------------------------------------------------- |
| **channelId**     | String | Normalized Keccak256 hash of the transaction that created the channel |
| **encryptedData** | String | Encrypted data in base64                                              |
| **hash**          | String | Normalized Keccak256 hash of the message before encryption            |

Example:

```JSON
{
    "channelId": "0xa8ea7b21ec36153beaa493f7afb082dc3e9886a41fcfc0ef72f3e175c2ad8b01",
    "encryptedData": "mBVy2ENb0Edkego5c9QXcFxszKxe7iQVE22wUPHMbrC7bBm99S238BAyACa1TBDlI4SajbrWM+/MG8CkBoph4FLTvh4PsUjhnfazFI9BnMtIMhdqDAoxXUSHsvnwbEFhllqwhFCWn6pslLNu7X7UJSDgj7nQ0t1IHegBSV7ZRqdOYw3UoxAEAyVOoUwMhr/sitF2AlgMSvKas5YCD47YIm6rDNmzyBn9Ed/fAxNojMXcg386khrPs37P6Q==",
    "hash": "0x8f94ee7e96fa65a761e8df9792af3f72fcf936f186fbb86881630f7d5333c8bb",
}
```

### Add new public keys

| Property      | Type   | Description                                                                          |
| ------------- | ------ | ------------------------------------------------------------------------------------ |
| **channelId** | String | Normalized Keccak256 hash of the transaction that created the channel                |
| **keys**      | Object | AES-256 key encrypted with ECIES from the new public keys indexed by their addresses |

Example:

```JSON
{
    "channelId": "0xa8ea7b21ec36153beaa493f7afb082dc3e9886a41fcfc0ef72f3e175c2ad8b01",
    "keys": {
        "0xc5fdf4076b8f3a5357c5e395ab970b5b54098fef": "OXdF4wZshE3+FM49ojErrgJIzqCx4r0DDj0bqof1yQJ7Kmz3zTaYh1xauD/Pq6HO1TJ3h+g4ca9DNzy2m2j7Q2RkqppeDkh4zsSyQ0eEN1dYLjfHqOisWelZ5l4hAH7+0LM8FHTCpKFJ1kSSHuALubYzbA+uO17eEr2dgzR3WaWDUhVn/uMYFwws3mHto41W4FWDGW+AWxIowhc3HrqsZRE=",
    }
}
```
