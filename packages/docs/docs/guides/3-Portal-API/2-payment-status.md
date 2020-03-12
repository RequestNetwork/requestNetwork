---
title: Payment status with the Portal API
sidebar_label: Payment status
keywords:

---

After creation, each request has a payment status, you can view the metadata of a request which contains the payment status via:

```jsx
const requestData = request.getData();
```

You will receive back an object that looks like this: 
```jsx
/*
{ 
  ...
  state,
  ...
}
*/
```

Attached to metadata is a field called `state` - the state will return the current payment status of the request, either ‘created’, ‘accepted’, ‘pending’ or ‘cancelled’.

You can also view the meta payments via the same call and looking at the meta field. This meta field will give you a full breakdown of each transaction that has been matched with the request. 

```jsx
{
  ...
  meta: {
    ignoredTransactions: [
      {
        reason // reason why the transaction has been ignored
        transaction // the ignored transaction
      }
    ],
    transactionManagerMeta: {
      dataAccessMeta: {
        storageMeta: [
          {
            ethereum: {
              blockConfirmation // number of confirmation of the block from where the data comes from
              blockNumber // the block number
              blockTimestamp // the block timestamp
              cost // total cost in wei paid to submit the block on ethereum
              fee // request fees paid in wei
              gasFee // ethereum gas fees paid in wei
              networkName // ethereum network name
              smartContractAddress // address of the smartcontract where the hash is stored
              transactionHash // ethereum transaction hash that stored the hash
            },
            ipfs: {
              size // size of the ipfs content of the block
            },
            storageType  // type of the storage (for now, always "ethereumIpfs")
            timestamp: // timestamp of the data (for now, always equals to the ethereum.blockTimestamp)
          }
        ],
        transactionsStorageLocation: [
          // location of the data used to interpret the request
        ]
      }
    }
  }
}
```
