# Request logic Specification v2.0.3

You can be interested in this document if:

- You want to create your own implementation of the request protocol
- You are curious enough to dive and see what is under the hood of the request protocol

You don't need to read this document if:

- You want to develop an app using the request protocol (see the API library instead [here](/packages/request-client.js))

## Previous version

| version | link                                                                                                                                       |
| ------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| 2.0.0   | see [8382917](https://github.com/RequestNetwork/requestNetwork/tree/83829178faf717f23f9554fd7266e7cc787e7106/packages/request-logic/specs) |
| 2.0.1   | see [8382917](https://github.com/RequestNetwork/requestNetwork/tree/83829178faf717f23f9554fd7266e7cc787e7106/packages/request-logic/specs) |
| 2.0.2   | see [8382917](https://github.com/RequestNetwork/requestNetwork/tree/83829178faf717f23f9554fd7266e7cc787e7106/packages/request-logic/specs) |

## Content table

- [Request logic Specification v2.0.3](#request-logic-specification-v200)
  - [Content table](#content-table)
  - [Request](#request)
    - [Properties](#properties)
    - [Actions](#actions)
      - [List of possible actions](#list-of-possible-actions)
      - [Create](#create)
        - [Parameters](#parameters)
        - [Conditions](#conditions)
        - [Result](#result)
        - [Example](#example)
      - [Accept](#accept)
        - [Parameters](#parameters-1)
        - [Conditions](#conditions-1)
        - [Result](#result-1)
        - [Example](#example-1)
      - [Cancel](#cancel)
        - [Parameters](#parameters-2)
        - [Conditions](#conditions-2)
        - [Result](#result-2)
        - [Example](#example-2)
      - [ReduceExpectedAmount](#reduceexpectedamount)
        - [Parameters](#parameters-3)
        - [Conditions](#conditions-3)
        - [Result](#result-3)
        - [Example](#example-3)
      - [IncreaseExpectedAmount](#increaseexpectedamount)
        - [Parameters](#parameters-4)
        - [Conditions](#conditions-4)
        - [Result](#result-4)
        - [Example](#example-4)
      - [AddExtensionsData](#addextensionsdata)
        - [Parameters](#parameters-5)
        - [Conditions](#conditions-5)
        - [Result](#result-5)
        - [Example](#example-5)
  - [Get a request from a list of actions](#get-a-request-from-a-list-of-actions)
  - [Types](#types)
    - [Identity type](#identity-type)
    - [Signature type](#signature-type)
    - [Amount type](#amount-type)
  - [Identity, Role and Signature](#identity--role-and-signature)
    - [Identity](#identity)
    - [Roles](#roles)
    - [Signature](#signature)
    - [SignatureParameters](#signatureparameters)
    - [Signature methods supported](#signature-methods-supported)
    - [Identity types supported](#identity-types-supported)
    - [How to sign a JSON object](#how-to-sign-a-json-object)
  - [Note on Version and Backward compatibility](#note-on-version-and-backward-compatibility)
  - [Example of a request state actions after actions](#example-of-a-request-state-actions-after-actions)

## Request

A request is the JSON object which`properties` returned from a list of `actions` that satisfies the following formats:

### Properties

| Property           | Type                                    | Description                                                                                                                                                                                       |
| ------------------ | --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **requestId**      | string                                  | ID as unique as possible                                                                                                                                                                          |
| **creator**        | Identity                                | Identity of the creator of the request                                                                                                                                                            |
| **payee**          | Identity                                | Identity of the payee                                                                                                                                                                             |
| **payer**          | Identity                                | Identity of the payer                                                                                                                                                                             |
| **expectedAmount** | Amount                                  | Amount expected to be paid                                                                                                                                                                        |
| **currency**       | Currency                                | Currency of the expected amount                                                                                                                                                                   |
| **state**          | Enum('created', 'accepted', 'canceled') | State of the request                                                                                                                                                                              |
| **events**         | Array                                   | History of the actions performed on the request                                                                                                                                                   |
| **extensionsData** | Array                                   | List of data used by the above layer                                                                                                                                                              |
| **version**        | String                                  | Specification version by the request _(2.0.3' here)_                                                                                                                                              |
|  **timestamp**     | Number                                  | - Timestamp of the request creation in seconds <br> - this timestamp is given by the creator. It is not trustless. <br> - This timestamp is also used to differentiate between identical requests |
|  **nonce**         | Number                                  | Number to differentiate several identical requests with the same timestamp                                                                                                                        |

Example

```JSON
{
   "creator":{
      "type":"ethereumAddress",
      "value":"0xAf083f77F1fFd54218d91491AFD06c9296EaC3ce"
   },
   "currency": {
      "type": "ETH",
      "value": "ETH",
      "network": "mainnet"
   },
   "events":[
      {
         "name":"create",
         "parameters":{
            "expectedAmount":"123400000000000000",
            "extensionsDataAddedLength":1,
            "isSignedRequest":false
         },
         "actionSigner":{
            "type":"ethereumAddress",
            "value":"0xAf083f77F1fFd54218d91491AFD06c9296EaC3ce"
         }
      }
   ],
   "expectedAmount":"123400000000000000",
   "extensionsData":[
      {
         "id":"extension1",
         "value":"whatever1"
      }
   ],
   "payee":{
      "type":"ethereumAddress",
      "value":"0xAf083f77F1fFd54218d91491AFD06c9296EaC3ce"
   },
   "payer":{
      "type":"ethereumAddress",
      "value":"0x740fc87Bd3f41d07d23A01DEc90623eBC5fed9D6"
   },
   "requestId":"011c2610cbc5bee43b6bc9800e69ec832fb7d50ea098a88877a0afdcac5981d3f8",
   "state":"created",
   "timestamp": 1545224094,
   "version":"2.0.3"
}
```

### Actions

An action is a JSON object created to modify the properties of a request.
An action is performed on a `request` under **conditions** specified in the action itself.
An action is ignored if there exists a previous identical action. If their normalized hashes (see [How to sign a JSON object](#how-to-sign-a-json-object)) are identical the second action is ignored.
This mechanism counters a replay attack where one can replay an action already signed (e.g.: reduceExpectedAmount).
If one wants to create two similar actions, he must add an arbitrary number (see nonce later in this document).

IMPORTANT :

- The `actions` of a `request` are **ordered** (it means that only one `action` modify a request at a time)
- An `action` which does not satisfy its condition will be simply ignored

| Property       | Type      | Description                                                    |
| -------------- | --------- | -------------------------------------------------------------- |
| **name**       | Enum()    | Name of the action to perform _(see list of possible actions)_ |
| **parameters** | Object    | Parameters of the actions                                      |
| **signature**  | Signature | Signature of the object { name, parameters, version }          |

#### List of possible actions

| Name                       | Description                  | Role Authorized           |
| -------------------------- | ---------------------------- | ------------------------- |
| **create**                 | create a request             | payee, payer              |
| **accept**                 | accept a request             | payer                     |
| **cancel**                 | cancel a request             | payee, payer              |
| **reduceExpectedAmount**   | reduce the expected amount   | payee                     |
| **increaseExpectedAmount** | increase the expected amount | payer                     |
| **addExtensionsData**      | add data for the extensions  | payee, payer, third-party |

---

#### Create

##### Parameters

|                    | Type     | Description                                                                                                                                                                                       | Requirement               |
| ------------------ | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------- |
| **version**        | String   | specification version                                                                                                                                                                             | **Mandatory**             |
| **expectedAmount** | Amount   | amount expected to be paid                                                                                                                                                                        | **Mandatory**             |
| **currency**       | Currency | Currency of the expected amount                                                                                                                                                                   | **Mandatory**             |
| **timestamp**      | Number   | - Timestamp of the request creation in seconds <br> - this timestamp is given by the creator. It is not trustless. <br> - This timestamp is also used to differentiate between identical requests | **Mandatory**             |
| **payee**          | Identity | identity of the payee                                                                                                                                                                             | Optional _if payer given_ |
| **payer**          | Identity | identity of the payer                                                                                                                                                                             | Optional _if payee given_ |
| **extensionsData** | Array    | list of data used by the above layer                                                                                                                                                              | Optional                  |
| **nonce**          | Number   | Number to differentiate several identical requests with the same timestamp <br> - should be incremented by one for every new identical request                                                    | Optional                  |

##### Conditions

This action is valid, if:

- the Role of the action **signer is payee or payer**

##### Result

A request created with the following properties:

| Property           | Value                                                               |
| ------------------ | ------------------------------------------------------------------- |
| **requestId**      | Hash of the signed action                                           |
| **creator**        | Identity of the signer                                              |
| **payee**          | payee from parameters if exists, undefined otherwise                |
| **payee**          | payer from parameters if exists, undefined otherwise                |
| **expectedAmount** | expectedAmount from parameters                                      |
| **currency**       | currency from parameters                                            |
| **state**          | `created` if signer is **payee**, `accepted` if signer is **payer** |
| **version**        | versions of Request protocol for which the request has been created |
| **extensionsData** | extensionsData from parameters if exists, [] otherwise              |
| **events**         | Array with one 'create' event _(see below)_                         |

the 'create' event:

| Property                                 | Value                                           |
| ---------------------------------------- | ----------------------------------------------- |
| **name**                                 | 'create'                                        |
| **parameters**                           | Object                                          |
| **parameters.isSignedRequest**           | false                                           |
| **parameters.ExpectedAmount**            | expectedAmount from parameters                  |
| **parameters.extensionsDataAddedLength** | length of the extensionsData from parameters    |
| **actionSigner**                         | Identity of the signer                          |

##### Example

Example of creation action:

```JSON
{
  "name":"create",
  "parameters":{
      "currency": {
         type: "ETH",
         value: "ETH",
         network: "mainnet"
      },
      "expectedAmount":"123400000000000000",
      "payee":{
        "type":"ethereumAddress",
        "value":"0xAf083f77F1fFd54218d91491AFD06c9296EaC3ce"
      },
      "timestamp": 1545224094,
  },
  "version":"2.0.3",
  "signature":{
    "method":"ecdsa",
    "value":"0x143f0965cb8628c93e6f59f39a7c86163a7de01df42c923e65e109bab336710d7b534615025ed0c285e8dcbba2f4e136afa497af792a63519c486b16f3ccabb41c"
  }
}
```

Example of 'create' event:

```JSON
{
   "name":"create",
   "parameters":{
      "expectedAmount":"123400000000000000",
      "extensionsLength":0,
      "isSignedRequest":false
   },
   "actionSigner":{
      "type":"ethereumAddress",
      "value":"0xAf083f77F1fFd54218d91491AFD06c9296EaC3ce"
   }
}
```

---

#### Accept

##### Parameters

|                    | Type   | Description                          | Requirement   |
| ------------------ | ------ | ------------------------------------ | ------------- |
| **requestId**      | String | ID of the request                    | **Mandatory** |
| **extensionsData** | Array  | list of data used by the above layer | Optional      |

##### Conditions

This action is valid, if:

- the request **has a payer**
- the Role of the action **signer is the payer**
- the request state is `created`

##### Result

Modify the following properties of the request:

| Property           | Value                                                |
| ------------------ | ---------------------------------------------------- |
| **state**          | `accepted`                                           |
| **extensionsData** | concat the extensionsData from parameters at its end |
| **events**         | add an 'accept' event _(see below)_ at its end       |

the 'accept' event:

| Property                                 | Value                                           |
| ---------------------------------------- | ----------------------------------------------- |
| **name**                                 | 'accept'                                        |
| **parameters**                           | Object                                          |
| **parameters.extensionsDataAddedLength** | length of the extensionsData from parameters    |
| **actionSigner**                         | Identity of the signer                          |

##### Example

Example of action creation:

```JSON
{
  "name":"accept",
  "parameters":{
      "requestId":"01d38a203d25e91ae0e0d3bcf149c44dac80e0990a812fce5ecd14bd27cb7fed2e",
  },
  "signature":{
    "method":"ecdsa",
    "value":"0x143f0965cb8628c93e6f59f39a7c86163a7de01df42c923e65e109bab336710d7b534615025ed0c285e8dcbba2f4e136afa497af792a63519c486b16f3ccabb41c"
  }
}
```

Example of 'accept' event:

```JSON
{
   "name":"accept",
   "parameters":{
      "extensionsLength":0,
   },
   "actionSigner":{
      "type":"ethereumAddress",
      "value":"0xAf083f77F1fFd54218d91491AFD06c9296EaC3ce"
   }
}
```

---

#### Cancel

##### Parameters

|                    | Type   | Description                          | Requirement   |
| ------------------ | ------ | ------------------------------------ | ------------- |
| **requestId**      | String | ID of the request                    | **Mandatory** |
| **extensionsData** | Array  | list of data used by the above layer | Optional      |

##### Conditions

This action is valid, if:

- the request **has a payer**
- the Role of the action **signer is the payer**
- the request state is `created`

  **Or, if**:

- the request **has a payee**
- the Role of the action **signer is the payee**
- the request state is **NOT** `canceled`

##### Result

Modify the following properties of the request:

| Property           | Value                                                |
| ------------------ | ---------------------------------------------------- |
| **state**          | `canceled`                                           |
| **extensionsData** | concat the extensionsData from parameters at its end |
| **events**         | add an 'cancel' event _(see below)_ at its end       |

the 'cancel' event:

| Property                                 | Value                                           |
| ---------------------------------------- | ----------------------------------------------- |
| **name**                                 | 'cancel'                                        |
| **parameters**                           | Object                                          |
| **parameters.extensionsDataAddedLength** | length of the extensionsData from parameters    |
| **actionSigner**                         | Identity of the signer                          |

##### Example

Example of cancel action:

```JSON
{
  "name":"cancel",
  "parameters":{
      "requestId":"01d38a203d25e91ae0e0d3bcf149c44dac80e0990a812fce5ecd14bd27cb7fed2e",
  },
  "signature":{
    "method":"ecdsa",
    "value":"0x143f0965cb8628c93e6f59f39a7c86163a7de01df42c923e65e109bab336710d7b534615025ed0c285e8dcbba2f4e136afa497af792a63519c486b16f3ccabb41c"
}
}
```

Example of 'cancel' event:

```JSON
{
   "name":"cancel",
   "parameters":{
      "extensionsLength":0,
   },
   "actionSigner":{
      "type":"ethereumAddress",
      "value":"0xAf083f77F1fFd54218d91491AFD06c9296EaC3ce"
   }
}
```

---

#### ReduceExpectedAmount

##### Parameters

|                    | Type   | Description                               | Requirement   |
| ------------------ | ------ | ----------------------------------------- | ------------- |
| **requestId**      | String | ID of the request                         | **Mandatory** |
| **deltaAmount**    | Amount | amount to reduce to the expectedAmount    | **Mandatory** |
| **extensionsData** | Array  | list of data used by the above layer      | Optional      |
| **nonce**          | Number | Number to differentiate identical actions | Optional      |

##### Conditions

This action is valid, if:

- the request **has a payee**
- the Role of the action **signer is the payee**
- the request state is **NOT** `canceled`
- the **deltaAmount is smaller or equal to expectedAmount**

##### Result

Modify the following properties of the request:

| Property           | Value                                                        |
| ------------------ | ------------------------------------------------------------ |
| **expectedAmount** | expectedAmount **minus** deltaAmount from parameters         |
| **extensionsData** | concat the extensionsData from parameters at its end         |
| **events**         | add an 'reduceExpectedAmount' event _(see below)_ at its end |

the 'reduceExpectedAmount' event:

| Property                                 | Value                                           |
| ---------------------------------------- | ----------------------------------------------- |
| **name**                                 | 'reduceExpectedAmount'                          |
| **parameters**                           | Object                                          |
| **parameters.deltaAmount**               | deltaAmount from parameters                     |
| **parameters.extensionsDataAddedLength** | length of the extensionsData from parameters    |
| **actionSigner**                         | Identity of the signer                          |

##### Example

Example of reduceExpectedAmount action:

```JSON
{
  "name":"reduceExpectedAmount",
  "parameters":{
    "requestId":"01d38a203d25e91ae0e0d3bcf149c44dac80e0990a812fce5ecd14bd27cb7fed2e",
    "deltaAmount": "10000000",
  },
  "signature":{
    "method":"ecdsa",
    "value":"0x143f0965cb8628c93e6f59f39a7c86163a7de01df42c923e65e109bab336710d7b534615025ed0c285e8dcbba2f4e136afa497af792a63519c486b16f3ccabb41c"
  }
}
```

Example of 'reduceExpectedAmount' event:

```JSON
{
   "name":"reduceExpectedAmount",
   "parameters":{
      "deltaAmount": "10000000",
      "extensionsLength":0,
   },
   "actionSigner":{
      "type":"ethereumAddress",
      "value":"0xAf083f77F1fFd54218d91491AFD06c9296EaC3ce"
   }
}
```

---

#### IncreaseExpectedAmount

##### Parameters

|                    | Type   | Description                               | Requirement   |
| ------------------ | ------ | ----------------------------------------- | ------------- |
| **requestId**      | String | ID of the request                         | **Mandatory** |
| **deltaAmount**    | Amount | amount to add to the expectedAmount       | **Mandatory** |
| **extensionsData** | Array  | list of data used by the above layer      | Optional      |
| **nonce**          | Number | Number to differentiate identical actions | Optional      |

##### Conditions

This action is valid, if:

- the request **has a payer**
- the Role of the action **signer is the payer**
- the request state is **NOT** `canceled`

##### Result

Modify the following properties of the request:

| Property           | Value                                                          |
| ------------------ | -------------------------------------------------------------- |
| **expectedAmount** | expectedAmount **plus** deltaAmount from parameters            |
| **extensionsData** | concat the extensionsData from parameters at its end           |
| **events**         | add an 'increaseExpectedAmount' event _(see below)_ at its end |

the 'increaseExpectedAmount' event:

| Property                                 | Value                                           |
| ---------------------------------------- | ----------------------------------------------- |
| **name**                                 | 'increaseExpectedAmount'                        |
| **parameters**                           | Object                                          |
| **parameters.deltaAmount**               | deltaAmount from parameters                     |
| **parameters.extensionsDataAddedLength** | length of the extensionsData from parameters    |
| **actionSigner**                         | Identity of the signer                          |

##### Example

Example of increaseExpectedAmount action:

```JSON
{
    "name":"increaseExpectedAmount",
    "parameters":{
        "requestId":"01d38a203d25e91ae0e0d3bcf149c44dac80e0990a812fce5ecd14bd27cb7fed2e",
        "deltaAmount": "10000000",
    },
    "signature":{
        "method":"ecdsa",
        "value":"0x143f0965cb8628c93e6f59f39a7c86163a7de01df42c923e65e109bab336710d7b534615025ed0c285e8dcbba2f4e136afa497af792a63519c486b16f3ccabb41c"
    }
}
```

Example of 'increaseExpectedAmount' event:

```JSON
{
   "name":"increaseExpectedAmount",
   "parameters":{
      "deltaAmount": "10000000",
      "extensionsLength":0,
   },
   "actionSigner":{
      "type":"ethereumAddress",
      "value":"0xAf083f77F1fFd54218d91491AFD06c9296EaC3ce"
   }
}
```

---

#### AddExtensionsData

##### Parameters

|                    | Type   | Description                               | Requirement   |
| ------------------ | ------ | ----------------------------------------- | ------------- |
| **requestId**      | String | ID of the request                         | **Mandatory** |
| **extensionsData** | Array  | list of data used by the above layer      | **Mandatory** |
| **nonce**          | Number | Number to differentiate identical actions | Optional      |

##### Conditions

None.

##### Result

Modify the following properties of the request:

| Property           | Value                                                     |
| ------------------ | --------------------------------------------------------- |
| **extensionsData** | concatenate with the extensionsData from parameters       |
| **events**         | add an 'addExtensionsData' event _(see below)_ at its end |

the 'addExtensionsData' event:

| Property                                 | Value                                           |
| ---------------------------------------- | ----------------------------------------------- |
| **name**                                 | 'addExtensionsData'                             |
| **parameters**                           | Object                                          |
| **parameters.extensionsDataAddedLength** | length of the extensionsData from parameters    |
| **actionSigner**                         | Identity of the signer                          |

##### Example

Example of addExtensionsData action:

```JSON
{
    "name":"addExtensionsData",
    "parameters":{
        "requestId":"01d38a203d25e91ae0e0d3bcf149c44dac80e0990a812fce5ecd14bd27cb7fed2e",
        "extensionsData": [{
            "id": "pn_btc_address_based",
            "action": "addPaymentAddress",
            "parameters": {
                "refundAddress": "2NEH4zBsz3za2hzjyjXsGETz4SpHzhjiSiG"
            }
        }]
    },
    "signature":{
        "method":"ecdsa",
        "value":"0x143f0965cb8628c93e6f59f39a7c86163a7de01df42c923e65e109bab336710d7b534615025ed0c285e8dcbba2f4e136afa497af792a63519c486b16f3ccabb41c"
    }
}
```

Example of 'addExtensionsData' event:

```JSON
{
   "name":"addExtensionsData",
   "parameters":{
      "extensionsLength":1,
   },
   "actionSigner":{
      "type":"ethereumAddress",
      "value":"0xAf083f77F1fFd54218d91491AFD06c9296EaC3ce"
   }
}
```

---

## Get a request from a list of actions

As mentioned above a `request` is an JSON object with `properties` modified by `actions`.
From another perspective, you can get the `properties` of a `request` by interpreting a list of `actions`.

---

## Types

### Identity type

(see Identity, Role and Signature)

### Signature type

(see Identity, Role and Signature)

### Currency type

To have a detailed understanding of the currency used on a request, we use an object with the following properties:

| Property    | Value                | Requirement   |
| ----------- | -------------------- | ------------- |
| **type**    | The currency type    | **Mandatory** |
| **value**   | The currency value   | **Mandatory** |
| **network** | The currency network | Optional      |

#### type

The currency types are represented as an enum. The currently supported currency types are:

- **BTC** - Bitcoin
- **ETH** - Ethereum
- **ERC20** - ERC20 tokens
- **ISO4217** - National currencies designated by the ISO-4217 standard (e.g.: USD, GBP, EUR, JPY...)

#### value

The currency value depends on it's type.

- For **BTC** and **ETH** types, currently, the values are always the same as the type (_BTC_ and _ETH_ respectivelly).
- For **ERC20** tokens the currency value is the token smart contract address.
- For **ISO4217** currencies the value is the currency name: USD, GBP, EUR, JPY...

#### network

Network defines the network the currency belongs to.
It's important to have this information here, because 10 ETH in mainnet is not the same as 10 ETH in testnet.

This optional value is free for the user to define, but some have meaningful values for payment networks in the Advanced Logic layer.

Some common values, including the default value in bold (if network is not declared), for the supported currency types are:

- **BTC**: **mainnet** and testnet
- **ETH** and **ERC20**: **mainnet** and rinkeby
- **ISO4217**: these are usually left empty, but can be useful in some cases, like when using a payment processor sandbox.

### Amount type

To have a standard format for number that avoid limitation of size number in some languages, a valid amount is a **`string`** representing a **positive `integer`** in **base 10**.

Examples:

```JSON
"11235813213455891442333776109871597258441816765" // OK
"0" // OK
0 // not valid
11235813213455891442333776109871597258441816765 // not valid
"-1123" // not valid
"3.14159" // not valid
"NaN" // not valid
"thirteen" // not valid
"0x12324094" // not valid
```

**Note:** Amounts can't have decimal numbers. But, each currency will be defined with it's own number of decimals (e.g.: 2 for USD, 18 for ETH, 8 for BTC )

Examples:

```JSON
"12345667890123456789"
// could mean:
// 123456678901234567.89 USD
// 123456678901.23456789 BTC
// 12.345667890123456789 ETH
```

---

## Identity, Role and Signature

To manage low level identity in the request logic we use three different types of objects:

- `Identity`: a public piece of information an actor uses to identify themself _(e.g.: the address in ethereum)_
- `Signature`: a proof of acknowledgment from an `Identity`
- `SignatureParameters`: the parameters needed for an `Identity` to create a `Signature` _(e.g.: the privatekey in ethereum)_
  And two methods:
- `sign()`: generate a `Signature` for data from `SignatureParameters`
- `recover()`: get the `Identity` from data and its `Signature`

```
                        +----------------+
                        |  Signed data   |
                        |                |
                        |   +--------+   |
                        |   |  Data  |   |
+--------+    Sign()    |   +--------+   |    Recover()    +----------+
|  Data  +------------->+                +---------------->+/Identity/|
+--------+              |  +-----------+ |                 +----------+
                        |  |/Signature/| |
                        |  +-----------+ |
                        +----------------+
```

### Identity

this is a json object with two properties:

- `type`: the type of identity _(e.g.: 'ethereumAddress' for an ethereum identity like)_
- `value`: the actual value to recognize the identity _(e.g.: for 'ethereumAddress' type, it would be something like '0x742d35cc6634c0532925a3b844bc454e4438f44e')_

Note: Two identities are equal if and only if their `type` and `value` are equal

Example

```JSON
{
    "type": "ethereumAddress",
    "value": "0x742d35cc6634c0532925a3b844bc454e4438f44e"
}
```

### Roles

Any `Identity` have one and only one `Role` in each request:

| Role           | conditions                                                   |
| -------------- | ------------------------------------------------------------ |
| **payee**      | the identity is equal to the request payee                   |
| **payer**      | the identity is equal to the request payer                   |
| **thirdparty** | **every other condition** listed above are **NOT satisfied** |

### Signature

this is a json object with two properties:

- `method`: the method to sign _(e.g.: 'ecdsa' for an Elliptic Curve Signature)_
- `value`: the signature itself

Note: Two signatures are equal if and only if their `method` and `value` are equal

Example

```JSON
{
    "method": "ecdsa",
    "value": "0xe649fdfe25c3ee33061a8159be9b941141121c5bed8d07664cb67b7912819b4539841a206636c190178ac58978926dad1fe3637a10b656705b71bda5e187510c1b"
}
```

### Signature methods supported

List of the Signature methods supported in this version:

| Method             | Signature Value                        | SignatureParameter privateKey          | Identity Type from recover()                                 | Comment                                                                                                                                                                                             |
| ------------------ | -------------------------------------- | -------------------------------------- | ------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **ecdsa**          | hexadecimal string (e.g.: "0xe649f..") | hexadecimal string (e.g.: "0xe649f..") | **EthereumAddress** _(see "Identity types supported" below)_ |
| **ecdsa-ethereum** | hexadecimal string (e.g.: "0xe649f..") | hexadecimal string (e.g.: "0xe649f..") | **EthereumAddress** _(see "Identity types supported" below)_ | Similar to ecdsa but the signature is made with the Ethereum padding `keccak256("\x19Ethereum Signed Message:\n" + len(message) + message))`. Used for signing with the web3 tools (like Metamask). |

### Identity types supported

List of the Identity types supported in this version:

| Type                      | Identity Value                         | extra value                                                                    | Signature Method                                      |
| ------------------------- | -------------------------------------- | ------------------------------------------------------------------------------ | ----------------------------------------------------- |
| **ethereumAddress**       | hexadecimal string (e.g.: "0xe649f..") | _none_                                                                         | **ecdsa** _(see "Signature methods supported" above)_ |
| **ethereumSmartContract** | hexadecimal string (e.g.: "0xe649f..") | optional: network ('mainnet', 'rinkeby', 'private'... ) 'mainnet' if not given |  *none*                                               |

### How to sign a JSON object

The signature of an JSON object is made on the `keccak256` hash of the object:

- with its properties deeply alphabetically sorted
- stringified
- lowerCased

## Note on Version and Backward compatibility

The versions of the Request logic specifications follow the semver 2.0.3.
Every request is create with one and only one version of the specification.

By default, an implementation of the specifications will be able to handle only the requests following the specification versions with:

- The **same `major`** version
- A **`minor`** version **equal or inferior**

Some exceptions will be done for versions that need to be blacklisted (e.g.: versions with vulnerabilities)

## Example of a request state actions after actions

Bob wants to request 0.12 BTC to Alice.

Bob has his private `Signature parameters` from which it can generate his `Identity`:

```JSON
{
  "signatureParams": {
    "method": "ecdsa",
    "privateKey": "0x04674d2e53e0e14653487d7323cc5f0a7959c83067f5654cafe4094bde90fa8a",
  },
  "identity": {
    "type": "ethereumAddress",
    "value": "0xAf083f77F1fFd54218d91491AFD06c9296EaC3ce",
  }
}
```

Alice has his own `Signature parameters` and `Identity`:

```JSON
{
  "signatureParams": {
    "method": "ecdsa",
    "privateKey": "0x0906ff14227cead2b25811514302d57706e7d5013fcc40eca5985b216baeb998",
  },
  "identity": {
    "type": "ethereumAddress",
    "value": "0x740fc87Bd3f41d07d23A01DEc90623eBC5fed9D6",
  }
}
```

1. Bob creates a request of 0.1234 ETH to Alice
2. Bob makes a discount of 0.1 ETH
3. Alice accept the request

We now follow the `state` of the request after each `actions`:

### 1. Bob creates a request of 0.1234 ETH to Alice

The action to create the request from Bob to Alice from Bob (signed by Bob):

```JSON
{
   "data":{
      "name":"create",
      "parameters":{
         "currency":{
            "type": "ETH",
            "value": "ETH",
            "network": "mainnet"
         },
         "expectedAmount":"123400000000000000",
         "payee":{
            "type":"ethereumAddress",
            "value":"0xAf083f77F1fFd54218d91491AFD06c9296EaC3ce"
         },
         "payer":{
            "type":"ethereumAddress",
            "value":"0x740fc87Bd3f41d07d23A01DEc90623eBC5fed9D6"
         },
         "timestamp":1544426030
      },
      "version":"2.0.3"
   },
   "signature":{
      "method":"ecdsa",
      "value":"0xac9e9e43381d882f3edc506277b8ad74ca3fc0ed2184663b65ccbab921df114807d7e68fd03b668afffee1feb977c9082657f1a05f57c0b1f92e9b46ca22dfc31c"
   }
}
```

The request state after interpreting the action above:

```JSON
{
   "currency":{
      "type": "ETH",
      "value": "ETH",
      "network": "mainnet"
   },
   "expectedAmount":"123400000000000000",
   "payee":{
      "type":"ethereumAddress",
      "value":"0xAf083f77F1fFd54218d91491AFD06c9296EaC3ce"
   },
   "payer":{
      "type":"ethereumAddress",
      "value":"0x740fc87Bd3f41d07d23A01DEc90623eBC5fed9D6"
   },
   "timestamp":1544426030,
   "requestId":"01d251224337a268cc4c6d73e02f883827a35789f6da15050655435348452d8905",
   "version":"2.0.3",
   "events":[
      {
         "actionSigner":{
            "type":"ethereumAddress",
            "value":"0xAf083f77F1fFd54218d91491AFD06c9296EaC3ce"
         },
         "name":"create",
         "parameters":{
            "expectedAmount":"123400000000000000",
            "extensionsDataLength":0,
            "isSignedRequest":false
         }
      }
   ],
   "state":"created",
   "creator":{
      "type":"ethereumAddress",
      "value":"0xAf083f77F1fFd54218d91491AFD06c9296EaC3ce"
   }
}
```

### 2. Bob makes a discount of 0.1 ETH

The action to make a discount (signed by Bob);

```JSON
{
   "data":{
      "name":"reduceExpectedAmount",
      "parameters":{
         "deltaAmount":"100000000000000000",
         "requestId":"01d251224337a268cc4c6d73e02f883827a35789f6da15050655435348452d8905"
      },
      "version":"2.0.3"
   },
   "signature":{
      "method":"ecdsa",
      "value":"0x649c5fdd54e781dfb480f9b01cc9ac8cd9d7630e2dd3b9a8443865ee00d5015805e6b3bbce9be35ef124e92afba80db79d913cdc756fe4e911f3413ae6a24b971b"
   }
}
```

The request state after interpreting the new action with the previous state:

```JSON
{
   "currency":{
      "type": "ETH",
      "value": "ETH",
      "network": "mainnet"
   },
   "expectedAmount":"23400000000000000",
   "payee":{
      "type":"ethereumAddress",
      "value":"0xAf083f77F1fFd54218d91491AFD06c9296EaC3ce"
   },
   "payer":{
      "type":"ethereumAddress",
      "value":"0x740fc87Bd3f41d07d23A01DEc90623eBC5fed9D6"
   },
   "timestamp":1544426030,
   "requestId":"01d251224337a268cc4c6d73e02f883827a35789f6da15050655435348452d8905",
   "version":"2.0.3",
   "events":[
      {
         "actionSigner":{
            "type":"ethereumAddress",
            "value":"0xAf083f77F1fFd54218d91491AFD06c9296EaC3ce"
         },
         "name":"create",
         "parameters":{
            "expectedAmount":"123400000000000000",
            "extensionsDataLength":0,
            "isSignedRequest":false
         }
      },
      {
         "actionSigner":{
            "type":"ethereumAddress",
            "value":"0xAf083f77F1fFd54218d91491AFD06c9296EaC3ce"
         },
         "name":"reduceExpectedAmount",
         "parameters":{
            "deltaAmount":"100000000000000000",
            "extensionsDataLength":0
         }
      }
   ],
   "state":"created",
   "creator":{
      "type":"ethereumAddress",
      "value":"0xAf083f77F1fFd54218d91491AFD06c9296EaC3ce"
   }
}
```

### 3. Alice accept the request

The action to accept the request (signed by Alice):

```JSON
{
   "data":{
      "name":"accept",
      "parameters":{
         "requestId":"01d251224337a268cc4c6d73e02f883827a35789f6da15050655435348452d8905"
      },
      "version":"2.0.3"
   },
   "signature":{
      "method":"ecdsa",
      "value":"0xf94380c553c90810deb5625571649759f8591bf923f5773e436fec322d01752d676a6f822dee2c2097f4bb70b16273b4826e6026f9f98a31cfafab8f1bdda2eb1b"
   }
}
```

The request state after interpreting the new action with the previous state:

```JSON
{
   "currency":{
      "type": "ETH",
      "value": "ETH",
      "network": "mainnet"
   },
   "expectedAmount":"23400000000000000",
   "payee":{
      "type":"ethereumAddress",
      "value":"0xAf083f77F1fFd54218d91491AFD06c9296EaC3ce"
   },
   "payer":{
      "type":"ethereumAddress",
      "value":"0x740fc87Bd3f41d07d23A01DEc90623eBC5fed9D6"
   },
   "timestamp":1544426030,
   "requestId":"01d251224337a268cc4c6d73e02f883827a35789f6da15050655435348452d8905",
   "version":"2.0.3",
   "events":[
      {
         "actionSigner":{
            "type":"ethereumAddress",
            "value":"0xAf083f77F1fFd54218d91491AFD06c9296EaC3ce"
         },
         "name":"create",
         "parameters":{
            "expectedAmount":"123400000000000000",
            "extensionsDataLength":0,
            "isSignedRequest":false
         }
      },
      {
         "actionSigner":{
            "type":"ethereumAddress",
            "value":"0xAf083f77F1fFd54218d91491AFD06c9296EaC3ce"
         },
         "name":"reduceExpectedAmount",
         "parameters":{
            "deltaAmount":"100000000000000000",
            "extensionsDataLength":0
         }
      },
      {
         "actionSigner":{
            "type":"ethereumAddress",
            "value":"0x740fc87Bd3f41d07d23A01DEc90623eBC5fed9D6"
         },
         "name":"accept",
         "parameters":{
            "extensionsDataLength":0
         }
      }
   ],
   "state":"accepted",
   "creator":{
      "type":"ethereumAddress",
      "value":"0xAf083f77F1fFd54218d91491AFD06c9296EaC3ce"
   }
}
```
