# `@requestNetwork/data-access`

> TODO: description

## Usage

```
const dataAccess = require('@requestNetwork/data-access');

// TODO: DEMONSTRATE API
```

## Architecture

The request network data-access implements the structure of the data on the blockchain

The architecture is made by a sorted list of `blocks`.
A `block` is a JSON (see /format) object containing:

- a sorted list of `transactions`
- an index of this transactions (a dictionary referencing the transactions by arbitrary string)

A `transaction` is an object containing the data as a string and the signature of these data. (the data will be the actions from the request logic layer)

### Example of a block

```JSON
{
   "header":{
      "index":{
         "0xaaaaaa":[
            0
         ],
         "0xccccccccccc":[
            0,
            1
         ],
         "0xe53f3ea2f5a8e5f2ceb89609a9c2fa783181e70f1a7508dccf5b770b846a6a8d":[
            0
         ],
         "0x320728cd4063b523cb1b4508c6e1627f497bde5cbd46b03430e438289c6e1d23":[
            1
         ]
      },
      "version":"0.1.0"
   },
   "transactions":[
      {
         "signature":{
            "method":"ecdsa",
            "value":"0x12345"
         },
         "transaction":{
            "attribut1":"plop",
            "attribut2":"value"
         }
      },
      {
         "signature":{
            "method":"ecdsa",
            "value":"0x12345"
         },
         "transaction":{
            "attribut1":"foo",
            "attribut2":"bar"
         }
      }
   ]
}
```
