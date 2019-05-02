# Advanced Logic

You can be interested in this document if:

- you want to create your own implementation of the Request protocol
- you want to implement a new extension in the advanced logic
- you are curious enough to dive and see what is under the hood of the Request protocol

You don't need to read this document if:

- you want to develop an app using the request protocol (see the API library instead [here](/packages/request-client.js))

Prerequisite: Having read the request logic specification (see [here](/packages/request-logic/specs/request-logic-specification-v2.0.0.md))

The advanced logic is made of `extensions` that add features to simple requests from the request logic.

## Extension type list

This list of possible extension types:

| Extension type  | type code        | Description                        | Note                                                                                                                                                                                                         |
| --------------- | ---------------- | ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Content data    | `contentData`    | Extra data to document the request | see [request data format](https://docs.request.network/development/v1/guides/using-request-network-data-format)                                                                                              |
| Payment Network | `paymentNetwork` | Payment detection                  | 3 types: <br> - Declarative (Bilateral consensus) <br> - Read (Proof of payment offchain) <br> - Write (Proof written by third party on chain) <br> Linked to currencies: <br> - BTC <br> - ETH <br> - [...] |

Other features (e.g. Escrow, Payment conditions...) are not handled in this first version but maybe develop later.

## Advanced logic architecture

The extensions of the advanced logic follow the same design as the requests in the request logic (properties, state, actions...). It provides also a `description` and `warnings`.

An extension is defined by :

- a list of `properties` (the `state` of an extension is its properties value at time t)
- a list of `actions` able to modify the `state`. Every action:
  - can have a list of `parameters` as input
  - must have a list of `conditions`, if they are not satisfied the action is ignored
  - can have a list of `warnings` to show the well-known vulnerabilities under conditions
  - can modify the `state`
- a way to interpret the `properties` offchain
- a `description` in English that explains the purpose of the extension. This explanation is targeted at the users of applications that don't support the extension in their UI.

The `actions` are stored in the array `extensionsData` of the request state.
The `extensionsData` are stored in the actions of the request logic.

There are two types of actions:

1. Creation
2. Update

An extension must have one and only one creation action.

An extension can **only be created at the creation of the request**.
**Only one instance of an `extension type`** can be created for each request.
The `actions` are ordered, the first `action` must be the `creation` and the following ones will be `updates`.
The `actions` are interpreted to build the `state` of the extension.

---

---

## Properties specification

The properties are in a JSON object.

| Property    | Type   | Description                                                       |
| ----------- | ------ | ----------------------------------------------------------------- |
| **id**      | String | Unique identification of the extension implementation             |
| **type**    | String | Type of the extension (e.g: "paymentNetwork", "contentData" ... ) |
| **version** | String | Specifications version of the extension                           |
| **values**  | Object | Specific properties of the extension                              |
| **events**  | Array  | List of the actions performed on the extension                    |

The types allowed in `values` are:

- Object
- Array
- String
- Enum
- Amount
- Identity

Example:

```JSON
{
    "type": "paymentNetwork",
    "id": "pn-bitcoin-address-based",
    "version": "0.1.0",
    "values": {
        "paymentAddress": "mt2pvgxvLv1A51A9CG8Qqo5YpAjfc7yChx",
    }
}
```

## Actions

### Actions specification

Specify an action of an extension is defining:

- is the action a `creation` or an `update`?
- the `action name`, if an update (for creation it is 'create')
- the `parameters`
- the `conditions` of validity (it can use the request state and the extension state )
- the `result` (the modification on the extension state)

#### Action name

If the action is the creation, the name must be `create`.
Otherwise, the name must be unique regarding the other actions name of the extension.

#### Action parameters

The parameters are specific to the extension.

#### Action conditions

The `conditions` validate the context of the actions.
The action will be taken into account only if all the conditions are satisfied.

Example:

    -   request currency must be 'BTC'
    -   transaction signer must be Payer
    -   request state must be 'accepted'

#### Action warnings

The `warnings` are shown when the actions match specific conditions.
The action will be applied but a message must be displayed.

Example:

    -   a bitcoin request created by a payer with the paymentAddress must show "the payment address have not been confirmed by the payee"

#### Action result

The action result defines the modification made on the extension `state` from the `action` and its `parameters`.

Example:

- the property 'paymentAddress' takes the value of paymentAddress from the action parameters
- increases the property 'lateFees' by 10 percent

#### Offchain interpretation

The key point of creating an extension is to provide an offchain interpretation.
The interpretation explains to the users on how to use the `state` and `actions` offchain.

Example:

- When a bitcoin transaction reaches the address given in `payeeAddress`, consider this transaction as payment for this request

### Actions implementation

#### Creation action

|                | Type   | Description                                              | Requirement   |
| -------------- | ------ | -------------------------------------------------------- | ------------- |
| **type**       | String | Type of the extension                                    | **Mandatory** |
| **version**    | String | Specification version of the extension                   | **Mandatory** |
| **id**         | String | Unique identification of the extension                   | **Mandatory** |
| **parameters** | Object | Parameters of the creation - specific for each extension | Optional      |

Example:

```JSON
{
    "type": "paymentNetwork",
    "id": "pn-bitcoin-address-based",
    "version": "0.1.0",
    "parameters": {
        "paymentAddress": "mt2pvgxvLv1A51A9CG8Qqo5YpAjfc7yChx",
    }
}
```

#### Update action

|                | Type   | Description                                              | Requirement   |
| -------------- | ------ | -------------------------------------------------------- | ------------- |
| **id**         | String | Unique identification of the extension                   | **Mandatory** |
| **action**     | String | Name of the action - specific for each extension         | **Mandatory** |
| **parameters** | Object | Parameters of the creation - specific for each extension | Optional      |

Example:

```JSON
{
    "id": "pn-bitcoin-address-based",
    "action": "addRefundAddress",
    "parameters": {
        "refundAddress": "mfsSPZdcdXwSMVkPwCsiW39P5y6eYE1bDM"
    }
}
```

---

---

# Extension versioning

All the extensions share one version instead of having a version per extension.
Having only one version for all the extensions, avoid the interdependence nightmare of having many extensions with many versions.

The rules to handle a difference of extension versions are:

- extension.version.major > expected
  - Ignore the request
  - Search for a new version of extensions implementation
- extension.version.major < expected
  - Ignore the request
  - warning: "obsolete version"
- extension.version.minor > expected
  - Ignore the request
  - Search for a new version of extensions implementation
- Otherwise:
  - Handle the request normally

Note: A special attention must be paid about the request that triggers research of a new version of the protocol implementation. This can be a way to make users to download malicious software.

---

---

# Extension or unknown action

If an extensionsData does not follow the specification, it can be a difference of version. See the chapter above.

If the version is correct, then 2 cases are possible:

- The request action is the request creation:

  - Ignore the request
  - warning: "unknown extension"

- Otherwise:

  - Ignore the extensionsData
  - warning : "Unknown extension data"
