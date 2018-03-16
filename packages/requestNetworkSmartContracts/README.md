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
cd package/requestNetworkSmartContracts 
truffle deploy --network development
```

### Develop on Rinkeby
Contract addresses
* RequestCore: 0x21d995b5d48bc0ed038e95a3da1be88b37a38dd8
* RequestEthereum: 0xafa312973909c3a541665e11c883a24a8eb10b2c

### Develop on the Main net 
not available yet


## Functions from RequestEthereum
### Create a new request as the payee
` function createRequestAsPayee(address[] _payeesIdAddress, address[] _payeesPaymentAddress, int256[] _expectedAmounts, address _payer, address _payerRefundAddress, string _data)` 
 
* @dev msg.sender will be the payee

* @param _payeesIdAddress array of payees address (the position 0 will be the payee - must be msg.sender - the others are subPayees)
* @param _payeesPaymentAddress array of payees address for payment (optional)
* @param _expectedAmounts array of Expected amount to be received by each payees
* @param _payer Entity supposed to pay
* @param _data Hash linking to additional data on the Request stored on IPFS

* @return Returns the id of the request 


### Create a new request as the payer
` function createRequestAsPayer(address[] _payeesIdAddress, int256[] _expectedAmounts, address _payerRefundAddress, uint256[] _payeeAmounts, uint256[] _additionals, string _data)`

* @dev msg.sender will be the payer

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
 
* @return true if the request is accepted, false otherwise


### Cancel a request
` function cancel(bytes32 _requestId)` 
 
msg.sender must be the extension used by the request, the _payer or the _payee.
Only request with all payees balance equals to zero can be cancel
 
* @param _requestId id of the request 
 
* @return true if the request is canceled


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
the payback must be lower than the amount already paid for the request

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


## Bug bounty
Will only be available after the audit during Q1 2018.


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
