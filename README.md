# Request JS Library Documentation 
## Introduction
Welcome to the requestNetwork.js documentation! requestNetwork.js is a Javascript library for interacting with the Request Network protocol. 
Using the library you can create new requests from your applications, pay them, consult them or update them from your own off-chain applications. 

If your application is decentralized and onchain on Ethereum, you can directly interact with our smart contracts. [Smart contract documentation](https://github.com/RequestNetwork/Request_SmartContracts/)

### Warning
This is still an alpha version which will evolve significantly before the main net release. 

### When developing you should know
Everything that is specified in the [wiki](https://github.com/RequestNetwork/Request/wiki).

Among other things, this documentation specifies the smart contract architecture, the different actions that can be done at specific times, the statuses, how to use the extensions, the fee management system, the cross currency feature, how to manage identity and what to expect from the reputation system.

### Tutorials
No tutorials available yet. Feel free to suggest yours and we will refer to it.
If you’re looking for an example, you can browse the app.request.network website and github

## Installation
requestNetwork.js ships as a CommonJS package.
CommonJS (recommended):
### Install

#### Using NPM
`npm install @requestnetwork/request-network.js --save`

#### Using Yarn
`yarn add @requestnetwork/request-network.js`

(We are currently working on retrieving the name of requestnetwork.js)

### Import
`import RequestNetwork from '@requestnetwork/request-network.js';`

### Tests
`npm install -g ganache-cli`

Launch a ganache-cli instance on a terminal:

`npm run ganache`

In a second terminal, deploy the contracts:

`npm run testdeploy`

You can now launch the unit tests:

`npm run testunit`


### Constructor
Default configuration (Infura and Rinkeby)

`let requestNetwork = new RequestNetwork();`

Custom configuration 

`let requestNetwork = new RequestNetwork(provider, networkId, useIpfsPublic);`

Instantiates a new RequestNetwork instance that provides the public interface to the requestNetwork.js library.

* @param   `provider`  The Web3.js Provider instance you would like the requestNetwork.js library to use for interacting with the Ethereum network.
* @param   `networkId`  the Ethereum network ID.
* @param   `useIpfsPublic`  use public ipfs node if true, private one specified in “src/config.json ipfs.nodeUrlDefault.private” otherwise

* @return  An instance of the requestNetwork.js RequestNetwork class.


### Async
requestNetwork.js is a promise-based library. This means that whenever an asynchronous call is required, the library method will return a native Javascript promise. You can therefore choose between using promise or async/await syntax when calling our async methods.

Every function that modify data on the blockchain will trigger first an event “broadcasted” when the transaction is submitted to the nodes, before returning the request data when the transaction is confirmed. You can specify a number of confirmations to wait before returning the promise in options.numberOfConfirmation - default to 0.

Async/await syntax (recommended):
```js
try {
  var data = await requestNetwork.requestEthereumService.accept(requestId).on('broadcasted', txHash => {
    //Transaction broadcasted
    console.log('transaction hash: ', txHash);
  });
  //Transaction mined
  console.log(data.request)
} catch (error) {
  console.log('Caught error: ', error);
}
 ```



Promise syntax:
```js
requestNetwork.requestEthereumService.accept(requestId).on('broadcasted', txHash => {
  //Transaction broadcasted
  console.log('Transaction hash: ', txHash);
}).then(data => {
  //Transaction mined
  console.log(data.request);
})
.catch(error => {
  console.log('Caught error: ', error);
});
```


As is the convention with promise-based libraries, if an error occurs, it is thrown. It is the callers responsibility to catch thrown errors and to handle them appropriately.

### Versioning
The library adheres to the Semantic Versioning 2.0.0 specification. 
Note that major version zero (0.y.z) is for initial development. Anything may change at any time. The public API should not be considered stable since the library is still an alpha and we will introduce backward incompatible changes to the interface without incrementing the major version until the 1.0.0 release. Our convention until then will be to increment the minor version whenever we introduce backward incompatible changes to the public interface, and to increment the patch version otherwise. 
Functions

## Functions
### Create a request as the payee
`public createRequestAsPayee(_payer: string, _amountInitial: any, _data ? : string, _extension ? : string, _extensionParams ? : Array < any >, _options ? : any)`

Emit the event `'broadcasted'` with `{transaction: {hash}}` when the transaction is submitted.

* @param   `_payer`             address of the payer
* @param   `_amountInitial`     amount initial expected of the request
* @param   `_data`              Json of the request's details (optional)
* @param   `_extension`         address of the extension contract of the request (optional)
* @param   `_extensionParams`   array of parameters for the extension (optional)
* @param   `_options`           options for the method (`gasPrice`, `gas`, `value`, `from`, `numberOfConfirmation`)
* @return  promise of the object containing the request and the transaction hash (`{request, transaction}`)


### Accept a request
`public accept(_requestId: string, _options ? : any)`

Emit the event `'broadcasted'` with `{transaction: {hash}}` when the transaction is submitted.

* @param   `_requestId`         requestId of the payer
* @param   `_options`           options for the method (`gasPrice`, `gas`, `value`, `from`, `numberOfConfirmation`)
* @return  promise of the object containing the request and the transaction hash (`{request, transaction}`)

### Cancel a request    
`public cancel(_requestId: string, _options ? : any)`

Emit the event `'broadcasted'` with `{transaction: {hash}}` when the transaction is submitted.

* @param   `_requestId`         requestId of the payer
* @param   `_options`           options for the method (`gasPrice`, `gas`, `value`, `from`, `numberOfConfirmation`)
* @return  promise of the object containing the request and the transaction hash (`{request, transaction}`)


### Pay a request
`public paymentAction(_requestId: string, _amount: any, _additionals: any, _options ? : any)` 

Emit the event `'broadcasted`' with `{transaction: {hash}}` when the transaction is submitted.

* @param   `_requestId`         requestId of the payer
* @param   `_amount`            amount to pay in wei
* @param   `_additionals`       additional to declaire in wei (optional)
* @param   `_options`           options for the method (`gasPrice`, `gas`, `value`, `from`, `numberOfConfirmation`)
* @return  promise of the object containing the request and the transaction hash (`{request, transaction}`)

### Refund a request    
`public refundAction(_requestId: string, _amount: any, _options ? : any)`

Emit the event `'broadcasted'` with `{transaction: {hash}}` when the transaction is submitted.

* @param   `_requestId`         requestId of the payer
* @param   `_amount`            amount to refund in wei
* @param   `_options`           options for the method (`gasPrice`, `gas`, `value`, `from`, `numberOfConfirmation`)
* @return  promise of the object containing the request and the transaction hash (`{request, transaction}`)


### Add subtracts to a request (only for the payee)
`public subtractAction(_requestId: string, _amount: any, _options ? : any)`

Emit the event `'broadcasted'` with `{transaction: {hash}}` when the transaction is submitted.

* @param   `_requestId`         requestId of the payer
* @param   `_amount`            subtract to declare in wei
* @param   `_options`           options for the method (`gasPrice`, `gas`, `value`, `from`, `numberOfConfirmation`)
* @return  promise of the object containing the request and the transaction hash (`{request, transaction}`)


### Add additionals to a request (only for the payer)    
`public additionalAction(_requestId: string, _amount: any, _options ? : any)`

Emit the event 'broadcasted' with {transaction: {hash}} when the transaction is submitted.
* @param   `_requestId`         requestId of the payer
* @param   `_amount`            subtract to declare in wei
* @param   `_options`           options for the method (`gasPrice`, `gas`, `value`, `from`, `numberOfConfirmation`)
* @return  promise of the object containing the request and the transaction hash (`{request, transaction}`)


### Get Request Currency Contract info
`public getRequestCurrencyContractInfo(_requestId: string)`

return `{}` always

* @param   `_requestId`    requestId of the request
* @return  promise of the object containing the information from the currency contract of the request (always `{}` here)


### Get Request by ID(Alias of `requestCoreServices.getRequest()`)

`public getRequest(_requestId: string)`

* @param   `_requestId`    requestId of the request
* @return  promise of the object containing the request


### Get Request by Transaction hash

`public getRequestByTransactionHash(_hash: string)`

Get a request and method called by the hash of a transaction
* @param   _hash    hash of the ethereum transaction
* @return  promise of the object containing the request and the transaction


### Get Request's events (Alias of `requestCoreServices.getRequestEvents()`)
`public getRequestEvents(_requestId: string, _fromBlock ?: number, _toBlock ?: number)`

* @param   `_requestId`    requestId of the request
* @param   `_fromBlock`    search events from this block (optional)
* @param   `_toBlock`    search events until this block (optional)
* @return  promise of the array of events about the request


### Get Request's events from currency contract (generic method)    
`public getRequestEventsCurrencyContractInfo(_requestId: string, _fromBlock ?: number, _toBlock ?: number)`

* @param   `_requestId`    requestId of the request
* @param   `_fromBlock`    search events from this block (optional)
* @param   `_toBlock`    search events until this block (optional)
* @return  promise of the object containing the events from the currency contract of the request (always `{}` here)
    
   

### Events
Here is the list of events produced by the Request Network smarts contracts. Note that the solidity types will be converted in strings when you receive them.

* event `Created(bytes32 indexed requestId, address indexed payee, address indexed payer)`
* event `Accepted(bytes32 indexed requestId)`
* event `Canceled(bytes32 indexed requestId)`
* event `UpdateBalance(bytes32 indexed requestId, int256 deltaAmount)`
* event `UpdateExpectedAmount(bytes32 indexed requestId, int256 deltaAmount)`
* event `NewPayee(bytes32 indexed requestId, address payee)`
* event `NewPayer(bytes32 indexed requestId, address payer)`
* event `NewExpectedAmount(bytes32 indexed requestId, int256 expectedAmount)`
* event `NewExtension(bytes32 indexed requestId, address extension)`
* event `NewData(bytes32 indexed requestId, string data)`

