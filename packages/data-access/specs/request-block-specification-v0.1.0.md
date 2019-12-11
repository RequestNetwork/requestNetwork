# Request Block Specification v0.1.0

You can be interested in this document if:

- You want to create your own implementation of the request protocol
- You are curious enough to dive and see what is under the hood of the request protocol

You don't need to read this document if:

- You want to develop an app using the request protocol (see the API library instead [here](/packages/request-client.js))

The Data Access layer is responsible for:

- Indexing transactions to allow retrieval
- Batching transactions

## Transactions indexing (Channel & Topics)

The indexing of the transactions is made by two mechanisms:

- Channel
- Topics

The channel in data-access allows to group several transactions under one string: the channel id. This channel is indexed by several strings called topics.

There are two ways of getting transactions:

- by channel id: this gets all the transactions of the channel
- by topic: this gets all the transactions of the channels indexed by this topic

## Transaction batching

The transaction are stored and indexed in blocks.
A block is JSON object containing two main parts:

- header: containing the information to index the transactions (channels and topics)
- transactions: the transactions themselves

## Block Properties

| Property              | Type   | Description                                                     |
| --------------------- | ------ | --------------------------------------------------------------- |
| **header.channelIds** | Object | Array of positions in transactions Array indexed by channel ids |
| **header.topics**     | Object | Array of topics indexed by channel ids                          |
| **header.version**    | String | Specification version _(0.1.0 here)_                            |
| **transactions**      | Array  | Array of transactions                                           |

Example

```JSON
{
   "header":{
      "channelIds":{
        "01de7dbbedbf4f37e173c8ab2cedeaed4d082c2308dee43efdb9c63b509ba4af8c": [0],
         "0193198e76fbd0a3fb356ae474a2c1198c7a7e6a54fb88e25570d41629f284796b": [1]
      },
      "topics":{
         "01de7dbbedbf4f37e173c8ab2cedeaed4d082c2308dee43efdb9c63b509ba4af8c":[
            "01eae6049bc398a881cfa03fc579a8f3285814d653d4eea3fe0657daa400377f91",
            "018e76f22ebc03520a70c6f683462e0a90494b69e989dfee397f53c46d4127632b",
            "01de7dbbedbf4f37e173c8ab2cedeaed4d082c2308dee43efdb9c63b509ba4af8c"
         ],
         "0193198e76fbd0a3fb356ae474a2c1198c7a7e6a54fb88e25570d41629f284796b":[
            "0132745f8e62e0835147bf113391b128b5bb3a82656ca4e17a39ce47e30678a95e",
            "018e76f22ebc03520a70c6f683462e0a90494b69e989dfee397f53c46d4127632b",
            "0193198e76fbd0a3fb356ae474a2c1198c7a7e6a54fb88e25570d41629f284796b"
         ]
      },
      "version":"0.1.0"
   },
   "transactions":[
      {
         "data":"{\"data\":{\"name\":\"create\",\"parameters\":{\"currency\":{\"type\":\"ISO4217\",\"value\":\"EUR\"},\"expectedAmount\":\"127771\",\"payee\":{\"type\":\"ethereumAddress\",\"value\":\"0x9a9498Ff431ffC055C67702187A2FD4aEB48A5Fd\"},\"payer\":{\"type\":\"ethereumAddress\",\"value\":\"0x15E3cD5842Bb4B51c1E4f0ED6e65f5b0E4c4b5b8\"},\"timestamp\":1575964864,\"nonce\":\"509f9ef42c9b0fed4d07\",\"extensionsData\":[{\"action\":\"create\",\"id\":\"pn-any-declarative\",\"parameters\":{},\"version\":\"0.1.0\"}]},\"version\":\"2.0.2\"},\"signature\":{\"method\":\"ecdsa\",\"value\":\"0x369a1000f3e2f78c59da39c8d607f43ce7f2d36b04c3985259e7bcfddc68e5a54bf72425aa82b6be0916495ed317accf9c551cee4b47a15bb86c4dfd0f3578f21c\"}}"
      },
      {
         "data":"{\"data\":{\"name\":\"create\",\"parameters\":{\"currency\":{\"type\":\"ISO4217\",\"value\":\"EUR\"},\"expectedAmount\":\"6049\",\"payee\":{\"type\":\"ethereumAddress\",\"value\":\"0x4258F0DD07f2af719BbD87e99e23E7ed5A9CE38c\"},\"payer\":{\"type\":\"ethereumAddress\",\"value\":\"0x15E3cD5842Bb4B51c1E4f0ED6e65f5b0E4c4b5b8\"},\"timestamp\":1575964861,\"nonce\":\"d3e7ea6a1e0feaed7464\",\"extensionsData\":[{\"action\":\"create\",\"id\":\"pn-any-declarative\",\"parameters\":{},\"version\":\"0.1.0\"}]},\"version\":\"2.0.2\"},\"signature\":{\"method\":\"ecdsa\",\"value\":\"0xe66d53a1b6177b1f1d601a52e3de5b7db330f77e1985b8dbeb2b08caf3b5aa0557301c1d91d6530791ad1ea83e1f43694811f662ef1229b1b68a11fcc474906b1c\"}}"
      }
   ]
}
```
