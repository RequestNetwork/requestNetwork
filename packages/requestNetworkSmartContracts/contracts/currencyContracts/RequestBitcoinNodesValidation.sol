pragma solidity ^0.4.23;

import "./CurrencyContract.sol";
import "../core/RequestCore.sol";
import "../base/math/SafeMathUint8.sol";
import "../utils/Bytes.sol";
import "../utils/Signature.sol";

/**
 * @title RequestBitcoinNodesValidation
 * @notice Currency contract managing the requests in Bitcoin
 * @dev Requests can be created by the Payee with createRequestAsPayeeAction() or by the payer from a request signed offchain by the payee with broadcastSignedRequestAsPayer
 */
contract RequestBitcoinNodesValidation is CurrencyContract {
    using SafeMath for uint256;
    using SafeMathInt for int256;
    using SafeMathUint8 for uint8;

    // bitcoin addresses for payment and refund by requestid
    // every time a transaction is sent to one of these addresses, it will be interpreted offchain as a payment (index 0 is the main payee, next indexes are for sub-payee)
    mapping(bytes32 => string[256]) public payeesPaymentAddress;

    // every time a transaction is sent to one of these addresses, it will be interpreted offchain as a refund (index 0 is the main payee, next indexes are for sub-payee)
    mapping(bytes32 => string[256]) public payerRefundAddress;

    /**
     * @param _requestCoreAddress Request Core address
     * @param _requestBurnerAddress Request Burner contract address
     */
    constructor (address _requestCoreAddress, address _requestBurnerAddress) 
        CurrencyContract(_requestCoreAddress, _requestBurnerAddress)
        public
    {
        // nothing to do here
    }

    /**
     * @notice Function to create a request as payee.
     *
     * @dev msg.sender must be the main payee.
     *
     * @param _payeesIdAddress array of payees address (the index 0 will be the payee - must be msg.sender - the others are subPayees)
     * @param _payeesPaymentAddress array of payees bitcoin address for payment as bytes (bitcoin address don't have a fixed size)
     *                                           [
     *                                            uint8(payee1_bitcoin_address_size)
     *                                            string(payee1_bitcoin_address)
     *                                            uint8(payee2_bitcoin_address_size)
     *                                            string(payee2_bitcoin_address)
     *                                            ...
     *                                           ]
     * @param _expectedAmounts array of Expected amount to be received by each payees
     * @param _payer Entity expected to pay
     * @param _payerRefundAddress payer bitcoin addresses for refund as bytes (bitcoin address don't have a fixed size)
     *                                           [
     *                                            uint8(payee1_refund_bitcoin_address_size)
     *                                            string(payee1_refund_bitcoin_address)
     *                                            uint8(payee2_refund_bitcoin_address_size)
     *                                            string(payee2_refund_bitcoin_address)
     *                                            ...
     *                                           ]
     * @param _data Hash linking to additional data on the Request stored on IPFS
     *
     * @return Returns the id of the request
     */
    function createRequestAsPayeeAction(
        address[]    _payeesIdAddress,
        bytes        _payeesPaymentAddress,
        int256[]     _expectedAmounts,
        address      _payer,
        bytes        _payerRefundAddress,
        string       _data)
        external
        payable
        whenNotPaused
        returns(bytes32 requestId)
    {
        require(msg.sender == _payeesIdAddress[0] && msg.sender != _payer && _payer != 0);

        uint256 collectedFees;
        (requestId, collectedFees) = createCoreRequestInternal(_payer, _payeesIdAddress, _expectedAmounts, _data);
        
        // Additional check on the fees: they should be equal to the about of ETH sent
        require(collectedFees == msg.value);
    
        extractAndStoreBitcoinAddresses(requestId, _payeesIdAddress.length, _payeesPaymentAddress, _payerRefundAddress);
        
        return requestId;
    }

    /**
     * @notice Function to broadcast and accept an offchain signed request (the broadcaster can also pays and makes additionals).
     *
     * @dev msg.sender will be the _payer.
     * @dev only the _payer can additionals.
     *
     * @param _requestData nested bytes containing : creator, payer, payees|expectedAmounts, data
     * @param _payeesPaymentAddress array of payees bitcoin address for payment as bytes
     *                                           [
     *                                            uint8(payee1_bitcoin_address_size)
     *                                            string(payee1_bitcoin_address)
     *                                            uint8(payee2_bitcoin_address_size)
     *                                            string(payee2_bitcoin_address)
     *                                            ...
     *                                           ]
     * @param _payerRefundAddress payer bitcoin addresses for refund as bytes
     *                                           [
     *                                            uint8(payee1_refund_bitcoin_address_size)
     *                                            string(payee1_refund_bitcoin_address)
     *                                            uint8(payee2_refund_bitcoin_address_size)
     *                                            string(payee2_refund_bitcoin_address)
     *                                            ...
     *                                           ]
     * @param _additionals array to increase the ExpectedAmount for payees
     * @param _expirationDate timestamp after that the signed request cannot be broadcasted
     * @param _signature ECDSA signature in bytes
     *
     * @return Returns the id of the request
     */
    function broadcastSignedRequestAsPayerAction(
        bytes         _requestData, // gather data to avoid "stack too deep"
        bytes         _payeesPaymentAddress,
        bytes         _payerRefundAddress,
        uint256[]     _additionals,
        uint256       _expirationDate,
        bytes         _signature)
        external
        payable
        whenNotPaused
        returns(bytes32 requestId)
    {
        // check expiration date
        // solium-disable-next-line security/no-block-members
        require(_expirationDate >= block.timestamp);

        // check the signature
        require(Signature.checkBtcRequestSignature(_requestData, _payeesPaymentAddress, _expirationDate, _signature));

        return createAcceptAndAdditionalsFromBytes(_requestData, _payeesPaymentAddress, _payerRefundAddress, _additionals);
    }

    /**
     * @dev Internal function to extract and store bitcoin addresses from bytes.
     *
     * @param _requestId                id of the request
     * @param _payeesCount              number of payees
     * @param _payeesPaymentAddress     array of payees bitcoin address for payment as bytes
     *                                           [
     *                                            uint8(payee1_bitcoin_address_size)
     *                                            string(payee1_bitcoin_address)
     *                                            uint8(payee2_bitcoin_address_size)
     *                                            string(payee2_bitcoin_address)
     *                                            ...
     *                                           ]
     * @param _payerRefundAddress       payer bitcoin addresses for refund as bytes
     *                                           [
     *                                            uint8(payee1_refund_bitcoin_address_size)
     *                                            string(payee1_refund_bitcoin_address)
     *                                            uint8(payee2_refund_bitcoin_address_size)
     *                                            string(payee2_refund_bitcoin_address)
     *                                            ...
     *                                           ]
     */
    function extractAndStoreBitcoinAddresses(
        bytes32     _requestId,
        uint256     _payeesCount,
        bytes       _payeesPaymentAddress,
        bytes       _payerRefundAddress) 
        internal
    {
        // set payment addresses for payees
        uint256 cursor = 0;
        uint8 sizeCurrentBitcoinAddress;
        uint8 j;
        for (j = 0; j < _payeesCount; j = j.add(1)) {
            // get the size of the current bitcoin address
            sizeCurrentBitcoinAddress = uint8(_payeesPaymentAddress[cursor]);

            // extract and store the current bitcoin address
            payeesPaymentAddress[_requestId][j] = Bytes.extractString(_payeesPaymentAddress, sizeCurrentBitcoinAddress, ++cursor);

            // move the cursor to the next bicoin address
            cursor += sizeCurrentBitcoinAddress;
        }

        // set payment address for payer
        cursor = 0;
        for (j = 0; j < _payeesCount; j = j.add(1)) {
            // get the size of the current bitcoin address
            sizeCurrentBitcoinAddress = uint8(_payerRefundAddress[cursor]);

            // extract and store the current bitcoin address
            payerRefundAddress[_requestId][j] = Bytes.extractString(_payerRefundAddress, sizeCurrentBitcoinAddress, ++cursor);

            // move the cursor to the next bicoin address
            cursor += sizeCurrentBitcoinAddress;
        }
    }

    /**
     * @dev Internal function to create, accept and add additionals to a request as Payer.
     *
     * @dev msg.sender must be _payer
     *
     * @param _requestData nasty bytes containing : creator, payer, payees|expectedAmounts, data
     * @param _payeesPaymentAddress array of payees bitcoin address for payment
     * @param _payerRefundAddress payer bitcoin address for refund
     * @param _additionals Will increase the ExpectedAmount of the request right after its creation by adding additionals
     *
     * @return Returns the id of the request
     */
    function createAcceptAndAdditionalsFromBytes(
        bytes         _requestData,
        bytes         _payeesPaymentAddress,
        bytes         _payerRefundAddress,
        uint256[]     _additionals)
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
            int256 expectedAmountTemp = int256(Bytes.extractBytes32(_requestData, uint256(i).mul(52).add(61)));
            // compute the total expected amount of the request
            totalExpectedAmounts = totalExpectedAmounts.add(expectedAmountTemp);
            // all expected amount must be positive
            require(expectedAmountTemp>0);
        }

        // compute and send fees
        uint256 fees = collectEstimation(totalExpectedAmounts);
        // check fees has been well received
        require(fees == msg.value && collectForREQBurning(fees));

        // insert the msg.sender as the payer in the bytes
        Bytes.updateBytes20inBytes(_requestData, 20, bytes20(msg.sender));
        // store request in the core
        requestId = requestCore.createRequestFromBytes(_requestData);
        
        // set bitcoin addresses
        extractAndStoreBitcoinAddresses(requestId, payeesCount, _payeesPaymentAddress, _payerRefundAddress);

        // accept and pay the request with the value remaining after the fee collect
        acceptAndAdditionals(requestId, _additionals);

        return requestId;
    }

    /**
     * @dev Internal function to accept and add additionals to a request as Payer
     *
     * @param _requestId id of the request
     * @param _additionals Will increase the ExpectedAmounts of payees
     *
     */    
    function acceptAndAdditionals(
        bytes32     _requestId,
        uint256[]   _additionals)
        internal
    {
        acceptAction(_requestId);
        
        additionalAction(_requestId, _additionals);
    }
}
