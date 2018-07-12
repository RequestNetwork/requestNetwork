pragma solidity ^0.4.23;

import "./CurrencyContract.sol";
import "../core/RequestCore.sol";
import "../base/math/SafeMathUint8.sol";
import "../base/token/ERC20.sol";
import "../utils/Bytes.sol";
import "../utils/Signature.sol";

/**
 * @title RequestEthereum
 * @notice Currency contract managing the requests in Ethereum.
 * @dev The contract can be paused. In this case, people can withdraw funds.
 * @dev Requests can be created by the Payee with createRequestAsPayeeAction(), by the payer with createRequestAsPayerAction() or by the payer from a request signed offchain by the payee with broadcastSignedRequestAsPayer().
 */
contract RequestEthereum is CurrencyContract {
    using SafeMath for uint256;
    using SafeMathInt for int256;
    using SafeMathUint8 for uint8;

    // payment addresses by requestId (optional). We separate the Identity of the payee/payer (in the core) and the wallet address in the currency contract
    mapping(bytes32 => address[256]) public payeesPaymentAddress;
    mapping(bytes32 => address) public payerRefundAddress;

    /**
     * @dev Constructor
     * @param _requestCoreAddress Request Core address
     * @param _requestBurnerAddress Request Burner contract address
     */
    constructor (address _requestCoreAddress, address _requestBurnerAddress)
        CurrencyContract(_requestCoreAddress, _requestBurnerAddress)
        public
    {
        requestCore = RequestCore(_requestCoreAddress);
    }

    /**
     * @notice Function to create a request as payee.
     *
     * @dev msg.sender will be the payee.
     * @dev if _payeesPaymentAddress.length > _payeesIdAddress.length, the extra addresses will be stored but never used.
     * @dev If a contract is given as a payee make sure it is payable. Otherwise, the request will not be payable.
     * @dev Is public instead of external to avoid "Stack too deep" exception.
     *
     * @param _payeesIdAddress array of payees address (the index 0 will be the payee - must be msg.sender - the others are subPayees)
     * @param _payeesPaymentAddress array of payees address for payment (optional)
     * @param _expectedAmounts array of Expected amount to be received by each payees
     * @param _payer Entity expected to pay
     * @param _payerRefundAddress Address of refund for the payer (optional)
     * @param _data Hash linking to additional data on the Request stored on IPFS
     *
     * @return Returns the id of the request
     */
    function createRequestAsPayeeAction(
        address[] 	_payeesIdAddress,
        address[] 	_payeesPaymentAddress,
        int256[] 	_expectedAmounts,
        address 	_payer,
        address 	_payerRefundAddress,
        string 		_data
        )
        public
        payable
        whenNotPaused
        returns(bytes32 requestId)
    {
        require(msg.sender == _payeesIdAddress[0] && msg.sender != _payer && _payer != 0);

        uint256 collectedFees;
        (requestId, collectedFees) = createCoreRequestInternal(_payer, _payeesIdAddress, _expectedAmounts, _data);

        // set payment addresses for payees
        for (uint8 j = 0; j < _payeesPaymentAddress.length; j = j.add(1)) {
            payeesPaymentAddress[requestId][j] = _payeesPaymentAddress[j];
        }

        // set payment address for payer
        if(_payerRefundAddress != 0) {
            payerRefundAddress[requestId] = _payerRefundAddress;
        }

        // check if the value send match exactly the fees (no under or over payment allowed)
        require(collectedFees == msg.value);

        return requestId;
    }

    /**
     * @notice Function to create a request as payer. The request is payed if _payeeAmounts > 0.
     *
     * @dev msg.sender will be the payer.
     * @dev If a contract is given as a payee make sure it is payable. Otherwise, the request will not be payable.
     * @dev payeesPaymentAddress is not offered as argument here to avoid scam.
     * @dev Is public instead of external to avoid "Stack too deep" exception.
     *
     * @param _payeesIdAddress array of payees address (the index 0 will be the payee the others are subPayees)
     * @param _expectedAmounts array of Expected amount to be received by each payees
     * @param _payerRefundAddress Address of refund for the payer (optional)
     * @param _payeeAmounts array of amount repartition for the payment
     * @param _additionals array to increase the ExpectedAmount for payees
     * @param _data Hash linking to additional data on the Request stored on IPFS
     *
     * @return Returns the id of the request
     */
    function createRequestAsPayerAction(
        address[] 	_payeesIdAddress,
        int256[] 	_expectedAmounts,
        address 	_payerRefundAddress,
        uint256[] 	_payeeAmounts,
        uint256[] 	_additionals,
        string 		_data
        )
        public
        payable
        whenNotPaused
        returns(bytes32 requestId)
    {
        require(msg.sender != _payeesIdAddress[0] && _payeesIdAddress[0] != 0);

        uint256 collectedFees;
        (requestId, collectedFees) = createCoreRequestInternal(msg.sender, _payeesIdAddress, _expectedAmounts, _data);

        // set payment address for payer
        if(_payerRefundAddress != 0) {
            payerRefundAddress[requestId] = _payerRefundAddress;
        }

        // accept and pay the request with the value remaining after the fee collect
        acceptAndPay(requestId, _payeeAmounts, _additionals, msg.value.sub(collectedFees));

        return requestId;
    }

    /**
     * @notice Function to broadcast and accept an offchain signed request (can be paid and additionals also).
     *
     * @dev _payer will be set msg.sender.
     * @dev if _payeesPaymentAddress.length > _requestData.payeesIdAddress.length, the extra addresses will be stored but never used.
     * @dev If a contract is given as a payee make sure it is payable. Otherwise, the request will not be payable.
     *
     * @param _requestData nested bytes containing : creator, payer, payees, expectedAmounts, data
     * @param _payeesPaymentAddress array of payees address for payment (optional) 
     * @param _payeeAmounts array of amount repartition for the payment
     * @param _additionals array to increase the ExpectedAmount for payees
     * @param _expirationDate timestamp after that the signed request cannot be broadcasted
     * @param _signature ECDSA signature in bytes
     *
     * @return Returns the id of the request
     */
    function broadcastSignedRequestAsPayer(
        bytes 		_requestData, // gather data to avoid "stack too deep"
        address[] 	_payeesPaymentAddress,
        uint256[] 	_payeeAmounts,
        uint256[] 	_additionals,
        uint256 	_expirationDate,
        bytes 		_signature)
        external
        payable
        whenNotPaused
        returns(bytes32)
    {
        // check expiration date
        // solium-disable-next-line security/no-block-members
        require(_expirationDate >= block.timestamp);

        // check the signature
        require(Signature.checkRequestSignature(_requestData, _payeesPaymentAddress, _expirationDate, _signature));

        // create accept and pay the request
        return createAcceptAndPayFromBytes(_requestData,  _payeesPaymentAddress, _payeeAmounts, _additionals);
    }

    /**
     * @notice Function PAYABLE to pay a request in ether.
     *
     * @dev the request will be automatically accepted if msg.sender==payer.
     *
     * @param _requestId id of the request
     * @param _payeeAmounts Amount to pay to payees (sum must be equal to msg.value) in wei
     * @param _additionalAmounts amount of additionals per payee in wei to declare
     */
    function paymentAction(
        bytes32 _requestId,
        uint256[] _payeeAmounts,
        uint256[] _additionalAmounts)
        external
        whenNotPaused
        payable
    {
        require(requestCore.getState(_requestId) != RequestCore.State.Canceled);
        require(_additionalAmounts.length == 0 || msg.sender == requestCore.getPayer(_requestId));


        // automatically accept request if request is created and msg.sender is payer
        if(requestCore.getState(_requestId)==RequestCore.State.Created && msg.sender == requestCore.getPayer(_requestId)) {
            requestCore.accept(_requestId);
        }

        additionalInternal(_requestId, _additionalAmounts);

        paymentInternal(_requestId, _payeeAmounts, msg.value);
    }

    /**
     * @notice Function PAYABLE to pay back in ether a request to the payer.
     *
     * @dev msg.sender must be one of the payees.
     * @dev the request must be created or accepted.
     *
     * @param _requestId id of the request
     */
    function refundAction(bytes32 _requestId)
        external
        whenNotPaused
        payable
    {
        refundInternal(_requestId, msg.sender, msg.value);
    }

    /**
     * @notice Function to declare an additional.
     *
     * @dev msg.sender must be _payer.
     * @dev the request must be accepted or created.
     *
     * @param _requestId id of the request
     * @param _additionalAmounts amounts of additional in wei to declare (index 0 is for main payee)
     */
    function additionalAction(bytes32 _requestId, uint256[] _additionalAmounts)
        public
        whenNotPaused
        onlyRequestPayer(_requestId)
    {
        require(requestCore.getState(_requestId)!=RequestCore.State.Canceled);
        additionalInternal(_requestId, _additionalAmounts);
    }

    /**
     * @notice Transfers to owner any tokens send by mistake on this contracts.
     * @param token The address of the token to transfer.
     * @param amount The amount to be transfered.
     */
    function emergencyERC20Drain(ERC20 token, uint amount )
        public
        onlyOwner 
    {
        token.transfer(owner, amount);
    }

    /**
     * @dev Internal function to accept, add additionals and pay a request as Payer.
     *
     * @param _requestId id of the request
     * @param _payeeAmounts Amount to pay to payees (sum must be equals to _amountPaid)
     * @param _additionals Will increase the ExpectedAmounts of payees
     * @param _amountPaid amount in msg.value minus the fees
     *
     */	
    function acceptAndPay(
        bytes32 _requestId,
        uint256[] _payeeAmounts,
        uint256[] _additionals,
        uint256 _amountPaid)
        internal
    {
        requestCore.accept(_requestId);
        
        additionalInternal(_requestId, _additionals);

        if(_amountPaid > 0) {
            paymentInternal(_requestId, _payeeAmounts, _amountPaid);
        }
    }    

    /**
     * @dev Internal function to create, accept, add additionals and pay a request as Payer.
     *
     * @dev msg.sender must be _payer.
     *
     * @param _requestData nested bytes containing : creator, payer, payees|expectedAmounts, data. To reduce the number of local variable and work around "stack too deep".
     * @param _payeesPaymentAddress array of payees address for payment (optional)
     * @param _payeeAmounts array of amount repartition for the payment
     * @param _additionals Will increase the ExpectedAmount of the request right after its creation by adding additionals
     *
     * @return Returns the id of the request
     */
    function createAcceptAndPayFromBytes(
        bytes 		_requestData,
        address[] 	_payeesPaymentAddress,
        uint256[] 	_payeeAmounts,
        uint256[] 	_additionals)
        internal
        returns(bytes32 requestId)
    {
        // extract main payee
        address mainPayee = Bytes.extractAddress(_requestData, 41);
        require(msg.sender != mainPayee && mainPayee != 0);
        // creator must be the main payee
        require(Bytes.extractAddress(_requestData, 0) == mainPayee);

        // extract the number of payees
        uint8 payeesCount = uint8(_requestData[40]);
        int256 totalExpectedAmounts = 0;
        for(uint8 i = 0; i < payeesCount; i++) {
            // extract the expectedAmount for the payee[i]
            // NB: no need of SafeMath here because 0 < i < 256 (uint8)
            int256 expectedAmountTemp = int256(Bytes.extractBytes32(_requestData, 61 + 52 * uint256(i)));
            // compute the total expected amount of the request
            totalExpectedAmounts = totalExpectedAmounts.add(expectedAmountTemp);
            // all expected amount must be positibe
            require(expectedAmountTemp>0);
        }

        // collect the fees
        uint256 fees = collectEstimation(totalExpectedAmounts);

        // check fees has been well received
        // do the action and assertion in one to save a variable
        require(collectForREQBurning(fees));

        // insert the msg.sender as the payer in the bytes
        Bytes.updateBytes20inBytes(_requestData, 20, bytes20(msg.sender));
        // store request in the core,
        requestId = requestCore.createRequestFromBytes(_requestData);

        // set payment addresses for payees
        for (uint8 j = 0; j < _payeesPaymentAddress.length; j = j.add(1)) {
            payeesPaymentAddress[requestId][j] = _payeesPaymentAddress[j];
        }

        // accept and pay the request with the value remaining after the fee collect
        acceptAndPay(requestId, _payeeAmounts, _additionals, msg.value.sub(fees));

        return requestId;
    }

    /**
     * @dev Internal function to manage additional declaration.
     *
     * @param _requestId id of the request
     * @param _additionalAmounts amount of additional to declare
     */
    function additionalInternal(bytes32 _requestId, uint256[] _additionalAmounts)
        internal
    {
        // we cannot have more additional amounts declared than actual payees but we can have fewer
        require(_additionalAmounts.length <= requestCore.getSubPayeesCount(_requestId).add(1));

        for(uint8 i = 0; i < _additionalAmounts.length; i = i.add(1)) {
            if(_additionalAmounts[i] != 0) {
                // Store and declare the additional in the core
                requestCore.updateExpectedAmount(_requestId, i, _additionalAmounts[i].toInt256Safe());
            }
        }
    }

    /**
     * @dev Internal function to manage payment declaration.
     *
     * @param _requestId id of the request
     * @param _payeeAmounts Amount to pay to payees (sum must be equals to msg.value)
     * @param _value amount paid
     */
    function paymentInternal(
        bytes32 	_requestId,
        uint256[] 	_payeeAmounts,
        uint256 	_value)
        internal
    {
        // we cannot have more amounts declared than actual payees
        require(_payeeAmounts.length <= requestCore.getSubPayeesCount(_requestId).add(1));

        uint256 totalPayeeAmounts = 0;

        for(uint8 i = 0; i < _payeeAmounts.length; i = i.add(1)) {
            if(_payeeAmounts[i] != 0) {
                // compute the total amount declared
                totalPayeeAmounts = totalPayeeAmounts.add(_payeeAmounts[i]);

                // Store and declare the payment to the core
                requestCore.updateBalance(_requestId, i, _payeeAmounts[i].toInt256Safe());

                // pay the payment address if given, the id address otherwise
                address addressToPay;
                if(payeesPaymentAddress[_requestId][i] == 0) {
                    addressToPay = requestCore.getPayeeAddress(_requestId, i);
                } else {
                    addressToPay = payeesPaymentAddress[_requestId][i];
                }

                //payment done, the money was sent
                fundOrderInternal(addressToPay, _payeeAmounts[i]);
            }
        }

        // check if payment repartition match the value paid
        require(_value==totalPayeeAmounts);
    }

    /**
     * @dev Internal function to manage refund declaration.
     *
     * @param _requestId id of the request

     * @param _fromAddress address from where the refund has been done
     * @param _amount amount of the refund in wei to declare
     */
    function refundInternal(
        bytes32 _requestId,
        address _fromAddress,
        uint256 _amount)
        internal
    {
        require(requestCore.getState(_requestId)!=RequestCore.State.Canceled);

        // Check if the _fromAddress is a payeesId
        // int16 to allow -1 value
        int16 payeeIndex = requestCore.getPayeeIndex(_requestId, _fromAddress);
        if(payeeIndex < 0) {
            uint8 payeesCount = requestCore.getSubPayeesCount(_requestId).add(1);

            // if not ID addresses maybe in the payee payments addresses
            for (uint8 i = 0; i < payeesCount && payeeIndex == -1; i = i.add(1)) {
                if(payeesPaymentAddress[_requestId][i] == _fromAddress) {
                    // get the payeeIndex
                    payeeIndex = int16(i);
                }
            }
        }
        // the address must be found somewhere
        require(payeeIndex >= 0); 

        // Casting to uin8 doesn"t lose bits because payeeIndex < 256. payeeIndex was declared int16 to allow -1
        requestCore.updateBalance(_requestId, uint8(payeeIndex), -_amount.toInt256Safe());

        // refund to the payment address if given, the id address otherwise
        address addressToPay = payerRefundAddress[_requestId];
        if(addressToPay == 0) {
            addressToPay = requestCore.getPayer(_requestId);
        }

        // refund declared, the money is ready to be sent to the payer
        fundOrderInternal(addressToPay, _amount);
    }

    /**
     * @dev Internal function to manage fund mouvement.
     * @dev We had to chose between a withdrawal pattern, a transfer pattern or a transfer+withdrawal pattern and chose the transfer pattern.
     * @dev The withdrawal pattern would make UX difficult. The transfer+withdrawal pattern would make contracts interacting with the request protocol complex.
     * @dev N.B.: The transfer pattern will have to be clearly explained to users. It enables a payee to create unpayable requests.
     *
     * @param _recipient address where the wei has to be sent to
     * @param _amount amount in wei to send
     *
     */
    function fundOrderInternal(
        address _recipient,
        uint256 _amount)
        internal
    {
        _recipient.transfer(_amount);
    }
}
