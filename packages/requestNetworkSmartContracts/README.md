# Request Smart Contracts Documentation 
## Introduction
Welcome to the Request Network Smart Contracts documentation. 
Using the smart contracts you can create new requests, pay them, consult them or update them from your own on-chain applications. 

If your application is off-chain, you can interact with the JS library. [View JS Library Documentation](https://github.com/RequestNetwork/requestNetwork.js) 

### Warning
This is still an alpha version which will evolve significantly before the main net release. 

### When developing you should know
Everything that is specified in the [wiki](https://github.com/RequestNetwork/Request/wiki).

Among other things, this documentation specifies the smart contract architecture, the different actions that can be done at specific times, the statuses, how to use the extensions, the fee management system, the cross currency feature, how to manage identity and what to expect from the reputation system.

### Tutorials
No tutorial available yet. Feel free to suggest yours and we will refer to it.

### Develop on test-rpc
You can deploy your own contracts on testrpc thanks to the truffle project:
```git clone https://github.com/RequestNetwork/Request_SmartContracts 
cd Request_SmartContracts 
truffle deploy --network development
```

### Develop on Rinkeby
Contract addresses
* RequestCore: 0xDD7dF24DBB1188b6e1baa9E17CBfD1dB3955C223
* RequestEthereum: 0x0d5D6c5aB28737C182B9e67194451c2C6BcA8623

### Develop on the Main net 
not available yet


## Functions from RequestEthereum
### Create a new request as the payee
` function createRequestAsPayee(address _payer, int256 _expectedAmount, address _extension, bytes32[9] _extensionParams, string _data)` 
 
msg.sender will be the payee
 
* @param _payer Entity supposed to pay
* @param _expectedAmount Expected amount to be received.
* @param _extension an extension can be linked to a request and allows advanced payments conditions such as escrow. Extensions have to be whitelisted in Core
* @param _extensionParams Parameters for the extensions. It is an array of 9 bytes32.
* @param _data Hash linking to additional data on the Request stored on IPFS

* @return Returns the id of the request 


### Create a new request as the payer
` function createRequestAsPayer(address _payee, int256 _expectedAmount, address _extension, bytes32[9] _extensionParams, uint256 _additionals, string  _data) `

msg.sender will be the payer
 
* @param _payee Entity which will receive the payment
* @param _expectedAmount Expected amount to be received.
* @param _extension an extension can be linked to a request and allows advanced payments conditions such as escrow. Extensions have to be whitelisted in Core
* @param _extensionParams Parameters for the extensions. It is an array of 9 bytes32.
* @param _data Hash linking to additional data on the Request stored on IPFS 
* @param _additionals Will increase the ExpectedAmount of the request right after its creation by adding additionals

* @return Returns the id of the request 


### Accept a request 
` function accept(bytes32 _requestId) ` 

msg.sender must be _payer or an extension used by the request
A request can also be accepted by using directly the payment function on a request in the Created status
 
* @param _requestId id of the request 
 
* @return true if the request is accepted, false otherwise



### Cancel a request
` function cancel(bytes32 _requestId)` 
 
msg.sender must be the extension used by the request, the _payer or the _payee.
Only request with balance equals to zero can be cancel
 
* @param _requestId id of the request 
 
* @return true if the request is canceled


### Pay a request
` function paymentAction(bytes32 _requestId, uint256 _additionals)` 
Function PAYABLE to pay in ether a request
 
the request must be accepted
 
* @param _requestId id of the request
* @param _additionals amount of additionals in wei to declare 


### Refund a request
` function refundAction(bytes32 _requestId)` 
Function PAYABLE to pay back in ether a request to the payee
 
msg.sender must be _payer
the request must be accepted
the payback must be lower than the amount already paid for the request
 
* @param _requestId id of the request


### Declare a subtract 
` function subtractAction(bytes32 _requestId, uint256 _amount)` 

 
msg.sender must be _payee or an extension used by the request
the request must be accepted or created
 
* @param _requestId id of the request
* @param _amount amount of subtract in wei to declare 

### Declare an additional
` function additionalAction(bytes32 _requestId, uint256 _amount)` 

msg.sender must be _payer or an extension used by the request
the request must be accepted or created
 
* @param _requestId id of the request
* @param _amount amount of additional in wei to declare 

### Withdraw
` function withdraw()` 

Function to withdraw locked up ether after a fail transfer. 
This function is a security measure if you send money to a contract that might reject the money. 
However it will protect only the contracts that can trigger the withdraw function afterwards.


## Bug bounty
Will only be available after the audit during Q1 2018.



