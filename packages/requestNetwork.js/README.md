# Request JS Library Documentation 
## Introduction
Welcome to the requestNetwork.js documentation! requestNetwork.js is a Javascript library for interacting with the Request Network protocol. 
Using the library you can create new requests from your applications, pay them, consult them or update them from your own off-chain applications. 

If your application is decentralized and onchain on Ethereum, you can directly interact with our smart contracts. [Smart contract documentation](/packages/requestNetworkSmartContracts)  

### Warning
This is still an alpha version which will evolve significantly before the main net release. 

### When developing you should know
Everything that is specified in the [wiki](https://github.com/RequestNetwork/Request/wiki).

Among other things, this documentation specifies the smart contract architecture, the different actions that can be done at specific times, the statuses, how to use the extensions, the fee management system, the cross currency feature, how to manage identity and what to expect from the reputation system.

### Tutorials
No tutorials available yet. Feel free to suggest yours and we will refer to it.
If you’re looking for an example, you can browse the app.request.network website and github

## Using
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

### Constructor
Default configuration (Infura and Rinkeby)

```js
let requestNetwork = new RequestNetwork();
```

Custom configuration 

```js
let requestNetwork = new RequestNetwork(provider, networkId, useIpfsPublic);
```

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

## Request Ethereum Service
### Create a request as the payee
```js
public createRequestAsPayee(_payeesIdAddress: string[], _expectedAmounts: any[], _payer: string, _payeesPaymentAddress ?: Array<string|undefined>, _payerRefundAddress ?: string, _data ?: string, _extension ?: string, _extensionParams ?: any[], _options ?: any)
```

Emit the event `'broadcasted'` with `{transaction: {hash}}` when the transaction is submitted.

* @param   `_payeesIdAddress`           ID addresses of the payees (the position 0 will be the main payee, must be the broadcaster address)
* @param   `_expectedAmounts`           amount initial expected per payees for the request
* @param   `_payer`                     address of the payer
* @param   `_payeesPaymentAddress`      payment addresses of the payees (the position 0 will be the main payee) (optional)
* @param   `_payerRefundAddress`        refund address of the payer (optional)
* @param   `_data`                     Json of the request's details (optional)
* @param   `_extension`                 address of the extension contract of the request (optional) NOT USED YET
* @param   `_extensionParams`           array of parameters for the extension (optional) NOT USED YET
* @param   `_options`                   options for the method (gasPrice, gas, value, from, numberOfConfirmation)
* @return  promise of the object containing the request and the transaction hash (`{request, transactionHash}`)


### Create a request as payer
```js
public createRequestAsPayer(_payeesIdAddress: string[], _expectedAmounts: any[], _payerRefundAddress ?: string, _amountsToPay ?: any[], _additionals ?: any[], _data ?: string, _extension ?: string, _extensionParams ?: any[], _options ?: any);
```

Emit the event `'broadcasted'` with `{transaction: {hash}}` when the transaction is submitted.

* @param   `_payeesIdAddress`           ID addresses of the payees (the position 0 will be the main payee)
* @param   `_expectedAmounts`           amount initial expected per payees for the request
* @param   `_payerRefundAddress`        refund address of the payer (optional)
* @param   `_amountsToPay`              amounts to pay in wei for each payee (optional)
* @param   `_additionals`               amounts of additional in wei for each payee (optional)
* @param   `_data`              Json of the request's details (optional)
* @param   `_extension`         address of the extension contract of the request (optional) NOT USED YET
* @param   `_extensionParams`   array of parameters for the extension (optional) NOT USED YET
* @param   `_options`           options for the method (`gasPrice`, `gas`, `value`, `from`, `numberOfConfirmation`)
* @return  promise of the object containing the request and the transaction hash (`{request, transaction}`)


### Sign a request as payee
```js
public signRequestAsPayee( _payeesIdAddress: string[], _expectedAmounts: any[], _expirationDate: number, _payeesPaymentAddress ?: Array<string|undefined>, _data ?: string, _extension ?: string, _extensionParams ?: any[], _from ?: string)
```

* @param   `_payeesIdAddress`           ID addresses of the payees (the position 0 will be the main payee, must be the signer address)
* @param   `_expectedAmounts`           amount initial expected per payees for the request
* @param   `_expirationDate`            timestamp in second of the date after which the signed request is not broadcastable
* @param   `_payeesPaymentAddress`      payment addresses of the payees (the position 0 will be the main payee) (optional)
* @param   `_data`              Json of the request's details (optional)
* @param   `_extension`         address of the extension contract of the request (optional) NOT USED YET
* @param   `_extensionParams`   array of parameters for the extension (optional) NOT USED YET
* @param   `_from`              address of the payee, default account will be used otherwise (optional)
* @return  promise of the object containing the request signed


### Broadcast a signed transaction and fill it with his address as payer
```js
public broadcastSignedRequestAsPayer( _signedRequest: any, _amountsToPay ?: any[], _additionals ?: any[], _options ?: any);
```

Emit the event `'broadcasted'` with `{transaction: {hash}}` when the transaction is submitted.

* @param   `_signedRequest`     object signed request (see Signed Request)
* @param   `_amountsToPay`      amounts to pay in wei for each payee (optional)
* @param   `_additionals`       amounts of additional in wei for each payee (optional)
* @param   `_options`           options for the method (gasPrice, gas, value, from, numberOfConfirmation)
* @return  promise of the object containing the request and the transaction hash ({request, transactionHash})


### Signed Request

```json
{
    "currencyContract": "Address of the currency contract",
    "data": "hash of the ipfs file(optional)",
    "expectedAmounts": "amount initial expected per payees for the request",
    "expirationDate": "unix timestamp of expiration date( in second)",
    "hash": "solidity hash of the request data",
    "payeesIdAddress": "ID addresses of the payees(the position 0 will be the main payee)",
    "payeesPaymentAddress": "payment addresses of the payees(the position 0 will be the main payee)(optional)",
    "signature": "signature by payee of the hash"
}
```

Example: 
```json
{  
   "currencyContract":"0xf12b5dd4ead5f743c6baa640b0216200e89b60da",
   "data":"QmbFpULNpMJEj9LfvhH4hSTfTse5YrS2JvhbHW6bDCNpwS",
   "expectedAmounts":[  
      "100000000",
      "20000000",
      "3000000"
   ],
   "expirationDate":7952342400000,
   "hash":"0x914512e0cc7597bea264a4741835257387b1fd66f81ea3947f113e4c20b4a679",
   "payeesIdAddress":[  
      "0x821aea9a577a9b44299b9c15c88cf3087f3b5544",
      "0x0d1d4e623d10f9fba5db95830f7d3839406c6af2",
      "0x2932b7a2355d6fecc4b5c0b6bd44cc31df247a2e"
   ],
   "payeesPaymentAddress":[  
      "0x6330a553fc93768f612722bb8c2ec78ac90b3bbc",
      null,
      "0x5aeda56215b167893e80b4fe645ba6d5bab767de"
   ],
   "signature":"0xbe2cc3516f1805ab619f550a16e39cb435a9873dd3c1a6dff430a345c30b206515217da7430306207c7cf06e092c84ef0fb3def78c87e4488a5babc8c6f9761a01"
}
```

### Check a signed request
```js
public isSignedRequestHasError(_signedRequest: any, _payer: string): string;
```

Check if a signed request is valid

* @param   `_signedRequest`     Signed request
* @param   `_payer`             Payer of the request
* @return  return a string with the error, or ''

### Accept a request
```js
public accept(_requestId: string, _options ? : any);
```

Emit the event `'broadcasted'` with `{transaction: {hash}}` when the transaction is submitted.

* @param   `_requestId`         requestId of the payer
* @param   `_options`           options for the method (`gasPrice`, `gas`, `value`, `from`, `numberOfConfirmation`)
* @return  promise of the object containing the request and the transaction hash (`{request, transaction}`)

### Cancel a request    
```js
public cancel(_requestId: string, _options ? : any);
```

Emit the event `'broadcasted'` with `{transaction: {hash}}` when the transaction is submitted.

* @param   `_requestId`         requestId of the payer
* @param   `_options`           options for the method (`gasPrice`, `gas`, `value`, `from`, `numberOfConfirmation`)
* @return  promise of the object containing the request and the transaction hash (`{request, transaction}`)


### Pay a request
```js
public paymentAction(_requestId: string, _amountsToPay: any[], _additionals ?: any[], _options ? : any);
```

Emit the event `'broadcasted`' with `{transaction: {hash}}` when the transaction is submitted.

* @param   `_requestId`         requestId of the payer
* @param   `_amountsToPay`      amounts to pay in wei for each payee
 * @param   `_additionals`       amounts of additional in wei for each payee (optional)
* @param   `_options`           options for the method (`gasPrice`, `gas`, `value`, `from`, `numberOfConfirmation`)
* @return  promise of the object containing the request and the transaction hash (`{request, transaction}`)

### Refund a request    
```js
public refundAction(_requestId: string, _amountToRefund: any, _options ? : any);
```

Emit the event `'broadcasted'` with `{transaction: {hash}}` when the transaction is submitted.
only addresses from payeesIdAddress and payeesPaymentAddress can refund a request

* @param   `_requestId`         requestId of the payer
* @param   `_amount`            amount to refund in wei
* @param   `_options`           options for the method (`gasPrice`, `gas`, `value`, `from`, `numberOfConfirmation`)
* @return  promise of the object containing the request and the transaction hash (`{request, transaction}`)


### Add subtracts to a request (only for the payee)
```js
public subtractAction(_requestId: string, _subtracts: any[], _options ? : any)
```

Emit the event `'broadcasted'` with `{transaction: {hash}}` when the transaction is submitted.

* @param   `_requestId`         requestId of the payer
* @param   `_subtracts`        amounts of subtracts in wei for each payee
* @param   `_options`           options for the method (`gasPrice`, `gas`, `value`, `from`, `numberOfConfirmation`)
* @return  promise of the object containing the request and the transaction hash (`{request, transaction}`)


### Add additionals to a request (only for the payer)    
```js
public additionalAction(_requestId: string, _additionals: any[], _options ? : any)
```

Emit the event 'broadcasted' with {transaction: {hash}} when the transaction is submitted.
* @param   `_requestId`         requestId of the payer
* @param   `_additionals`       amounts of additionals in wei for each payee
* @param   `_options`           options for the method (`gasPrice`, `gas`, `value`, `from`, `numberOfConfirmation`)
* @return  promise of the object containing the request and the transaction hash (`{request, transaction}`)


### Get Request Currency Contract info
```js
public getRequestCurrencyContractInfo(_requestId: string)
```

return `{}` always

* @param   `_requestId`    requestId of the request
* @return  promise of the object containing the information from the currency contract of the request (always `{}` here)


### Get Request by ID(Alias of `requestCoreServices.getRequest()`)
```js
public getRequest(_requestId: string)
```

* @param   `_requestId`    requestId of the request
* @return  promise of the object containing the request


### Get Request by Transaction hash
```js
public getRequestByTransactionHash(_hash: string)
```

Get a request and method called by the hash of a transaction
* @param   _hash    hash of the ethereum transaction
* @return  promise of the object containing the request and the transaction


### Get Request's events (Alias of `requestCoreServices.getRequestEvents()`)
```js
public getRequestEvents(_requestId: string, _fromBlock ?: number, _toBlock ?: number)
```

* @param   `_requestId`    requestId of the request
* @param   `_fromBlock`    search events from this block (optional)
* @param   `_toBlock`    search events until this block (optional)
* @return  promise of the array of events about the request


### Get Request's events from currency contract (generic method)    
```js
public getRequestEventsCurrencyContractInfo(_requestId: string, _fromBlock ?: number, _toBlock ?: number)
```

* @param   `_requestId`    requestId of the request
* @param   `_fromBlock`    search events from this block (optional)
* @param   `_toBlock`    search events until this block (optional)
* @return  promise of the object containing the events from the currency contract of the request (always `{}` here)
    
## Request ERC20 Service

### Create a request as the payee
```js
createRequestAsPayee(_tokenAddress: string, _payeesIdAddress: string[], _expectedAmounts: any[], _payer: string, _payeesPaymentAddress ?: Array<string|undefined>, _payerRefundAddress ?: string, _data ?: string, _extension ?: string, _extensionParams ?: any[] , _options ?: any);
```

emit the event `'broadcasted'` with `{transaction: {hash}}` when the transaction is submitted

* @param   `_tokenAddress`              Address token used for payment
* @param   `_payeesIdAddress`           ID addresses of the payees (the position 0 will be the main payee, must be the broadcaster address)
* @param   `_expectedAmounts`           amount initial expected per payees for the request
* @param   `_payer`                     address of the payer
* @param   `_payeesPaymentAddress`      payment addresses of the payees (the position 0 will be the main payee) (optional)
* @param   `_payerRefundAddress`        refund address of the payer (optional)
* @param   `_data`                      Json of the request's details (optional)
* @param   `_extension`                 address of the extension contract of the request (optional) NOT USED YET
* @param   `_extensionParams`           array of parameters for the extension (optional) NOT USED YET
* @param   `_options`                   options for the method (gasPrice, gas, value, from, numberOfConfirmation)
* @return  promise of the object containing the request and the transaction hash (`{request, transactionHash}`)


### Sign a request as payee
```js
public signRequestAsPayee(_tokenAddress: string, _payeesIdAddress: string[], _expectedAmounts: any[], _expirationDate: number, _payeesPaymentAddress ?: Array<string|undefined>, _data ?: string, _extension ?: string, _extensionParams ?: any[], _from ?: string);
```

* @param   `_tokenAddress`              Address token used for payment
* @param   `_payeesIdAddress`           ID addresses of the payees (the position 0 will be the main payee, must be the broadcaster address)
* @param   `_expectedAmounts`           amount initial expected per payees for the request
* @param   `_expirationDate`            timestamp in second of the date after which the signed request is not broadcastable
* @param   `_payeesPaymentAddress`      payment addresses of the payees (the position 0 will be the main payee) (optional)
* @param   `_data`                      Json of the request's details (optional)
* @param   `_extension`                 address of the extension contract of the request (optional) NOT USED YET
* @param   `_extensionParams`           array of parameters for the extension (optional) NOT USED YET
* @param   `_from`                      address of the payee, default account will be used otherwise (optional)
* @return  promise of the object containing the request signed


### Broadcast a signed transaction and fill it with his address as payer
```js
broadcastSignedRequestAsPayer(_signedRequest: any, _amountsToPay ?: any[], _additionals ?: any[], _options ?: any);
```

Emit the event `'broadcasted'` with `{transaction: {hash}}` when the transaction is submitted.

* @param   `_signedRequest`     object signed request (see Signed Request)
* @param   `_amountsToPay`      amounts to pay in wei for each payee (optional)
* @param   `_additionals`       amounts of additional in wei for each payee (optional)
* @param   `_options`           options for the method (`gasPrice`, `gas`, `value`, `from`, `numberOfConfirmation`, `skipERC20checkAllowance`)
* @return  promise of the object containing the request and the transaction hash ({request, transactionHash})


### Signed Request

```json
{
    "tokenAddress": "Address of the ERC20 token to pay the request",
    "currencyContract": "Address of the currency contract",
    "data": "hash of the ipfs file(optional)",
    "expectedAmounts": "amount initial expected per payees for the request",
    "expirationDate": "unix timestamp of expiration date( in second)",
    "hash": "solidity hash of the request data",
    "payeesIdAddress": "ID addresses of the payees(the position 0 will be the main payee)",
    "payeesPaymentAddress": "payment addresses of the payees(the position 0 will be the main payee)(optional)",
    "signature": "signature by payee of the hash"
}
```

Example: 
```json
{  
   "tokenAddress": "0xf25186B5081Ff5cE73482AD761DB0eB0d25abfBF",
   "currencyContract":"0xf12b5dd4ead5f743c6baa640b0216200e89b60da",
   "data":"QmbFpULNpMJEj9LfvhH4hSTfTse5YrS2JvhbHW6bDCNpwS",
   "expectedAmounts":[  
      "100000000",
      "20000000",
      "3000000"
   ],
   "expirationDate":7952342400000,
   "hash":"0x914512e0cc7597bea264a4741835257387b1fd66f81ea3947f113e4c20b4a679",
   "payeesIdAddress":[  
      "0x821aea9a577a9b44299b9c15c88cf3087f3b5544",
      "0x0d1d4e623d10f9fba5db95830f7d3839406c6af2",
      "0x2932b7a2355d6fecc4b5c0b6bd44cc31df247a2e"
   ],
   "payeesPaymentAddress":[  
      "0x6330a553fc93768f612722bb8c2ec78ac90b3bbc",
      null,
      "0x5aeda56215b167893e80b4fe645ba6d5bab767de"
   ],
   "signature":"0xbe2cc3516f1805ab619f550a16e39cb435a9873dd3c1a6dff430a345c30b206515217da7430306207c7cf06e092c84ef0fb3def78c87e4488a5babc8c6f9761a01"
}
```


### Check a signed request
```js
public isSignedRequestHasError(_signedRequest: any, _payer: string): string;
```

Check if a signed request is valid

* @param   `_signedRequest`     Signed request
* @param   `_payer`             Payer of the request
* @return  return a string with the error, or ''

### Accept a request
```js
public accept(_requestId: string, _options ? : any);
```

Emit the event `'broadcasted'` with `{transaction: {hash}}` when the transaction is submitted.

* @param   `_requestId`         requestId of the payer
* @param   `_options`           options for the method (`gasPrice`, `gas`, `value`, `from`, `numberOfConfirmation`)
* @return  promise of the object containing the request and the transaction hash (`{request, transaction}`)

### Cancel a request    
```js
public cancel(_requestId: string, _options ? : any);
```

Emit the event `'broadcasted'` with `{transaction: {hash}}` when the transaction is submitted.

* @param   `_requestId`         requestId of the payer
* @param   `_options`           options for the method (`gasPrice`, `gas`, `value`, `from`, `numberOfConfirmation`)
* @return  promise of the object containing the request and the transaction hash (`{request, transaction}`)


### Pay a request
```js
public paymentAction(_requestId: string, _amountsToPay: any[], _additionals ?: any[], _options ? : any);
```

Emit the event `'broadcasted`' with `{transaction: {hash}}` when the transaction is submitted.

* @param   `_requestId`         requestId of the payer
* @param   `_amountsToPay`      amounts to pay in wei for each payee
* @param   `_additionals`       amounts of additional in wei for each payee (optional)
* @param   `_options`           options for the method (`gasPrice`, `gas`, `value`, `from`, `numberOfConfirmation`, `skipERC20checkAllowance`)
* @return  promise of the object containing the request and the transaction hash (`{request, transaction}`)

### Refund a request    
```js
public refundAction(_requestId: string, _amountToRefund: any, _options ? : any);
```

Emit the event `'broadcasted'` with `{transaction: {hash}}` when the transaction is submitted.
only addresses from payeesIdAddress and payeesPaymentAddress can refund a request

* @param   `_requestId`         requestId of the payer
* @param   `_amountToRefund`    amount to refund in wei
* @param   `_options`           options for the method (`gasPrice`, `gas`, `value`, `from`, `numberOfConfirmation`, `skipERC20checkAllowance`)
* @return  promise of the object containing the request and the transaction hash (`{request, transaction}`)


### Add subtracts to a request (only for the payee)
```js
public subtractAction(_requestId: string, _subtracts: any[], _options ? : any)
```

Emit the event `'broadcasted'` with `{transaction: {hash}}` when the transaction is submitted.

* @param   `_requestId`         requestId of the payer
* @param   `_subtracts`        amounts of subtracts in wei for each payee
* @param   `_options`           options for the method (`gasPrice`, `gas`, `value`, `from`, `numberOfConfirmation`)
* @return  promise of the object containing the request and the transaction hash (`{request, transaction}`)


### Add additionals to a request (only for the payer)    
```js
public additionalAction(_requestId: string, _additionals: any[], _options ? : any)
```

Emit the event 'broadcasted' with {transaction: {hash}} when the transaction is submitted.
* @param   `_requestId`         requestId of the payer
* @param   `_additionals`       amounts of additionals in wei for each payee
* @param   `_options`           options for the method (`gasPrice`, `gas`, `value`, `from`, `numberOfConfirmation`)
* @return  promise of the object containing the request and the transaction hash (`{request, transaction}`)


### Get Request Currency Contract info
```js
public getRequestCurrencyContractInfo(_requestId: string)
```

* @param   `_requestId`    requestId of the request
* @return  promise of the object containing the information from the currency contract of the request


### Get Request by ID(Alias of `requestCoreServices.getRequest()`)
```js
public getRequest(_requestId: string)
```

* @param   `_requestId`    requestId of the request
* @return  promise of the object containing the request


### Get Request by Transaction hash
```js
public getRequestByTransactionHash(_hash: string)
```

Get a request and method called by the hash of a transaction
* @param   _hash    hash of the ethereum transaction
* @return  promise of the object containing the request and the transaction


### Get Request's events (Alias of `requestCoreServices.getRequestEvents()`)
```js
public getRequestEvents(_requestId: string, _fromBlock ?: number, _toBlock ?: number)
```

* @param   `_requestId`    requestId of the request
* @param   `_fromBlock`    search events from this block (optional)
* @param   `_toBlock`    search events until this block (optional)
* @return  promise of the array of events about the request






### Do a token allowance for a request
```js
public approveTokenForRequest(_requestId: string, _amount: any, _options ?: any)
```

* @param   `_requestId`     requestId of the request
* @param   `_amount`        amount to allowed
* @param   `_options`       options for the method (gasPrice, gas, value, from, numberOfConfirmation)
* @return  promise of the amount allowed


### Do a token allowance for a signed request
```js
public approveTokenForSignedRequest(_signedRequest: any, _amount: any, _options ?: any)
```

* @param   `_signedRequest`     object signed request
* @param   `_amount`            amount to allowed
* @param   `_options`           options for the method (gasPrice, gas, value, from, numberOfConfirmation)
* @return  promise of the amount allowed


### Get a token allowance
```js
public getTokenAllowance(_tokenAddress: string, _currencyContractAddress: string, _options: any)
```

* @param   `_tokenAddress`                  token address
* @param   `_currencyContractAddress`       currency contract address
* @param   `_options`                       options for the method (here only from)
* @return  promise of the amount allowed


## Events
Here is the list of events produced by the Request Network smarts contracts. Note that the solidity types will be converted in strings when you receive them.

* event `Created(bytes32 indexed requestId, address indexed payee, address indexed payer)`
* event `Accepted(bytes32 indexed requestId)`
* event `Canceled(bytes32 indexed requestId)`
* event `UpdateBalance(bytes32 indexed requestId, uint8 payeeIndex, int256 deltaAmount)`
* event `UpdateExpectedAmount(bytes32 indexed requestId, uint8 payeeIndex, int256 deltaAmount)`
* event `NewSubPayee(bytes32 indexed requestId, address indexed payee)`

## Developing
### Set up

Install ganache globally if it isn't already installed
`npm install -g ganache-cli`

Install lerna and bootstrap it, to install the dependencies and link the packages together
`npm install --global lerna`

`lerna bootstrap`

### Running the tests
Launch a ganache-cli instance on a terminal:

`npm run ganache`

In a second terminal, Launch an ipfs node:

`ipfs daemon`

In a third terminal, deploy the contracts:

`npm run testdeploy`

You can now launch the unit tests:

`npm run test`
