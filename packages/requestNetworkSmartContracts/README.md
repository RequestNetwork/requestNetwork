# Request Smart Contracts Documentation 

## Introduction
Welcome to the Request Network Smart Contracts documentation. 
Using the smart contracts you can create new requests, pay them, consult them or update them from your own on-chain applications. 

If your application is off-chain, you can interact with the JS library. [View JS Library Documentation](https://github.com/RequestNetwork/requestNetwork) 

### Warning
This is still an alpha version which will evolve significantly before the main net release. 

### When developing you should know
Everything that is specified in the [wiki](https://github.com/RequestNetwork/Request/wiki).

Among other things, this documentation specifies the smart contract architecture, the different actions that can be done at specific times, the statuses, how to use the extensions, the fee management system, the cross currency feature, how to manage identity and what to expect from the reputation system.

### Tutorials
No tutorial available yet. Feel free to suggest yours and we will refer to it.

### Develop on test-rpc
You can deploy your own contracts on testrpc thanks to the truffle project:
```git clone https://github.com/RequestNetwork/requestNetwork 
cd packages/requestNetworkSmartContracts 
truffle deploy --network development
```

### Develop on Rinkeby
Contract addresses
* RequestCore: 0x8fc2e7f2498f1d06461ee2d547002611b801202b
* RequestEthereum: 0xd88ab9b1691340e04a5bbf78529c11d592d35f57
* RequestERC20 token CTBK : 0xc3ba385addea98bb0af084b1e8bdc909f0215bbf  (test token CTBK 0x995d6a8c21f24be1dd04e105dd0d83758343e258)

### Develop on the Main net 
Contract addresses
* RequestCore: 0xdb600fda54568a35b78565b5257125bebc51eb27
* RequestEthereum: 0x3038045cd883abff0c6eea4b1954843c0fa5a735

## Functions from RequestEthereum
### Create a new request as the payee
` function createRequestAsPayee(address[] _payeesIdAddress, address[] _payeesPaymentAddress, int256[] _expectedAmounts, address _payer, address _payerRefundAddress, string _data)` 
 
msg.sender will be the payee
If a contract is given as a payee make sure it is payable. Otherwise, the request will not be payable.
 
* @param _payeesIdAddress array of payees address (the position 0 will be the payee - must be msg.sender - the others are subPayees)
* @param _payeesPaymentAddress array of payees address for payment (optional)
* @param _expectedAmounts array of Expected amount to be received by each payees
* @param _payer Entity supposed to pay
* @param _data Hash linking to additional data on the Request stored on IPFS

* @return Returns the id of the request 


### Create a new request as the payer
` function createRequestAsPayer(address[] _payeesIdAddress, int256[] _expectedAmounts, address _payerRefundAddress, uint256[] _payeeAmounts, uint256[] _additionals, string _data)`

msg.sender will be the payer
If a contract is given as a payee make sure it is payable. Otherwise, the request will not be payable.

* @param _payeesIdAddress array of payees address (the position 0 will be the payee the others are subPayees)
* @param _expectedAmounts array of Expected amount to be received by each payees
* @param _payeeAmounts array of amount repartition for the payment
* @param _additionals array to increase the ExpectedAmount for payees
* @param _data Hash linking to additional data on the Request stored on IPFS

* @return Returns the id of the request 

### Broadcast a signed request
` function broadcastSignedRequestAsPayer(bytes _requestData, address[] _payeesPaymentAddress, uint256[] _payeeAmounts, uint256[] _additionals, uint256 _expirationDate, bytes _signature) `

msg.sender must be _payer
the _payer can additionals 
If a contract is given as a payee make sure it is payable. Otherwise, the request will not be payable.

* @param _requestData nasty bytes containing : creator, payer, payees|expectedAmounts, data 
* @param _payeesPaymentAddress array of payees address for payment (optional)
* @param _payeeAmounts array of amount repartition for the payment
* @param _additionals array to increase the ExpectedAmount for payees
* @param _expirationDate timestamp after that the signed request cannot be broadcasted
* @param _signature ECDSA signature in bytes

* @return Returns the id of the request 

### Accept a request 
` function accept(bytes32 _requestId) ` 

msg.sender must be _payer or an extension used by the request
A request can also be accepted by using directly the payment function on a request in the Created status
 
* @param _requestId id of the request


### Cancel a request
` function cancel(bytes32 _requestId)` 
 
msg.sender must be the extension used by the request, the _payer or the _payee.
Only request with all payees balance equals to zero can be cancel
 
* @param _requestId id of the request


### Pay a request
` paymentAction(bytes32 _requestId, uint256[] _payeeAmounts, uint256[] _additionalAmounts) ` 
Function PAYABLE to pay in ether a request
 
the request must be created or accepted
the request will be automatically accepted if msg.sender==payer. 

* @param _requestId id of the request
* @param _payeesAmounts Amount to pay to payees (sum must be equals to msg.value)
* @param _additionalsAmount amount of additionals per payee in wei to declare


### Refund a request
` function refundAction(bytes32 _requestId)` 
Function PAYABLE to pay back in ether a request to the payee
 
msg.sender must be one of the payees
the request must be created or accepted

* @param _requestId id of the request


### Declare a subtract 
` subtractAction(bytes32 _requestId, uint256[] _subtractAmounts) ` 

 
msg.sender must be _payee
the request must be accepted or created
 
* @param _requestId id of the request
* @param _subtractAmounts amounts of subtract in wei to declare (position 0 is for ) 


### Declare an additional
` function additionalAction(bytes32 _requestId, uint256[] _additionalAmounts)` 

msg.sender must be _payer
the request must be accepted or created
 
* @param _requestId id of the request
* @param _additionalAmounts amounts of additional in wei to declare (index 0 is for )


### Withdraw
` function withdraw()` 

Function to withdraw locked up ether after a fail transfer. 
This function is a security measure if you send money to a contract that might reject the money. 
However it will protect only the contracts that can trigger the withdraw function afterwards.

## Functions from RequestERC20
### Create a new request as the payee
`createRequestAsPayeeAction(address[] _payeesIdAddress, address[] _payeesPaymentAddress, int256[] _expectedAmounts, address _payer, address _payerRefundAddress, string _data)` 
Function to create a request as payee

* @dev msg.sender must be the main payee
* @dev if _payeesPaymentAddress.length > _payeesIdAddress.length, the extra addresses will be stored but never used

* @param _payeesIdAddress array of payees address (the index 0 will be the payee - must be msg.sender - the others are subPayees)
* @param _payeesPaymentAddress array of payees address for payment (optional)
* @param _expectedAmounts array of Expected amount to be received by each payees
* @param _payer Entity expected to pay
* @param _payerRefundAddress Address of refund for the payer (optional)
* @param _data Hash linking to additional data on the Request stored on IPFS

* @return Returns the id of the request

### Broadcast a signed request
` function broadcastSignedRequestAsPayer(bytes _requestData, address[] _payeesPaymentAddress, uint256[] _payeeAmounts, uint256[] _additionals, uint256 _expirationDate, bytes _signature)`
Function to broadcast and accept an offchain signed request (can be paid and additionals also)


 * @dev msg.sender vill be the _payer
 * @dev only the _payer can additionals
 * @dev if _payeesPaymentAddress.length > _requestData.payeesIdAddress.length, the extra addresses will be stored but never used

 * @param _requestData nasty bytes containing : creator, payer, payees|expectedAmounts, data
 * @param _payeesPaymentAddress array of payees address for payment (optional) 
 * @param _payeeAmounts array of amount repartition for the payment
 * @param _additionals array to increase the ExpectedAmount for payees
 * @param _expirationDate timestamp after that the signed request cannot be broadcasted
 * @param _signature ECDSA signature in bytes

 * @return Returns the id of the request

### Accept a request 
` function accept(bytes32 _requestId) ` 

msg.sender must be _payer or an extension used by the request
A request can also be accepted by using directly the payment function on a request in the Created status
 
* @param _requestId id of the request


### Cancel a request
` function cancel(bytes32 _requestId)` 
 
msg.sender must be the extension used by the request, the _payer or the _payee.
Only request with all payees balance equals to zero can be cancel
 
* @param _requestId id of the request


### Pay a request
` paymentAction(bytes32 _requestId, uint256[] _payeeAmounts, uint256[] _additionalAmounts) ` 
Function to pay a request in ERC20 token

* @dev msg.sender must have a balance of the token higher or equal to the sum of _payeeAmounts
* @dev msg.sender must have approved an amount of the token higher or equal to the sum of _payeeAmounts to the current contract
* @dev the request will be automatically accepted if msg.sender==payer. 

* @param _requestId id of the request
* @param _payeeAmounts Amount to pay to payees (sum must be equal to msg.value) in wei
* @param _additionalAmounts amount of additionals per payee in wei to declare


### Refund a request
` function refundAction(bytes32 _requestId, uint256 _amountToRefund)` 
Function to pay back in ERC20 token a request to the payees

* @dev msg.sender must have a balance of the token higher or equal to _amountToRefund
* @dev msg.sender must have approved an amount of the token higher or equal to _amountToRefund to the current contract
* @dev msg.sender must be one of the payees or one of the payees payment address
* @dev the request must be created or accepted

* @param _requestId id of the request


### Declare a subtract 
` subtractAction(bytes32 _requestId, uint256[] _subtractAmounts)` 

 
msg.sender must be _payee
the request must be accepted or created
 
* @param _requestId id of the request
* @param _subtractAmounts amounts of subtract in wei to declare (position 0 is for ) 


### Declare an additional
` function additionalAction(bytes32 _requestId, uint256[] _additionalAmounts)` 

msg.sender must be _payer
the request must be accepted or created
 
* @param _requestId id of the request
* @param _additionalAmounts amounts of additional in wei to declare (index 0 is for )



## Bug bounty
See this article https://blog.request.network/request-network-bug-bounty-live-ee3297e46695


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

You can now launch the unit tests:

`npm run test`


### Building the artifacts
To build the artifacts, run
`npm run build`
This will compile the contracts through truffle and run exportArtifacts.js on the export of truffle. 
The output will be accessible in export/

To clean build/ (temporary folder, output of truffle) and export/, run
`npm run clean`
