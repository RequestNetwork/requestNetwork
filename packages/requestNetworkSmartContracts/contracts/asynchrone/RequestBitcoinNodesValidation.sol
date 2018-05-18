pragma solidity ^0.4.18;

import '../core/RequestCore.sol';
import '../base/math/SafeMathUint8.sol';
import '../core/RequestCurrencyContractInterface.sol';

/**
 * @title RequestBitcoinNodesValidation
 *
 * @dev RequestBitcoinNodesValidation is the currency contract managing the request in Bitcoin
 * @dev The contract can be paused. In this case, nobody can create Requests anymore but people can still interact with them or withdraw funds.
 *
 * @dev Requests can be created by the Payee with createRequestAsPayee(), by the payer with createRequestAsPayer() or by the payer from a request signed offchain by the payee with broadcastSignedRequestAsPayer
 */
contract RequestBitcoinNodesValidation is RequestCurrencyContractInterface {
    using SafeMath for uint256;
    using SafeMathInt for int256;
    using SafeMathUint8 for uint8;

    // bitcoin addresses for payment and refund by requestid
    // every time a transaction is sent to one of these addresses, it will be interpreted offchain as a payment (index 0 is the main payee, next indexes are for sub-payee)
    mapping(bytes32 => string[256]) public payeesPaymentAddress;
    // every time a transaction is sent to one of these addresses, it will be interpreted offchain as a refund (index 0 is the main payee, next indexes are for sub-payee)
    mapping(bytes32 => string[256]) public payerRefundAddress;

    /*
     * @dev Constructor
     * @param _requestCoreAddress Request Core address
     * @param _requestBurnerAddress Request Burner contract address
     */
    function RequestBitcoinNodesValidation(address _requestCoreAddress, address _requestBurnerAddress) 
        RequestCurrencyContractInterface(_requestCoreAddress, _requestBurnerAddress)
        public
    {
        // nothing to do here
    }

    /*
     * @dev Function to create a request as payee
     *
     * @dev msg.sender must be the main payee
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

        int256 totalExpectedAmounts;
        (requestId, totalExpectedAmounts) = createCoreRequestInternal(_payer, _payeesIdAddress, _expectedAmounts, _data);
        
        // compute and send fees
        uint256 fees = collectEstimation(totalExpectedAmounts);
        require(fees == msg.value && collectForREQBurning(fees));
    
        extractAndStoreBitcoinAddresses(requestId, _payeesIdAddress.length, _payeesPaymentAddress, _payerRefundAddress);
        
        return requestId;
    }

    /*
     * @dev Internal function to extract and store bitcoin addresses from bytes
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
            payeesPaymentAddress[_requestId][j] = extractString(_payeesPaymentAddress, sizeCurrentBitcoinAddress, ++cursor);

            // move the cursor to the next bicoin address
            cursor += sizeCurrentBitcoinAddress;
        }

        // set payment address for payer
        cursor = 0;
        for (j = 0; j < _payeesCount; j = j.add(1)) {
            // get the size of the current bitcoin address
            sizeCurrentBitcoinAddress = uint8(_payerRefundAddress[cursor]);

            // extract and store the current bitcoin address
            payerRefundAddress[_requestId][j] = extractString(_payerRefundAddress, sizeCurrentBitcoinAddress, ++cursor);

            // move the cursor to the next bicoin address
            cursor += sizeCurrentBitcoinAddress;
        }
    }

    /*
     * @dev Function to broadcast and accept an offchain signed request (the broadcaster can also pays and makes additionals )
     *
     * @dev msg.sender will be the _payer
     * @dev only the _payer can additionals
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
        require(_expirationDate >= block.timestamp);

        // check the signature
        require(checkRequestSignature(_requestData, _payeesPaymentAddress, _expirationDate, _signature));

        return createAcceptAndAdditionalsFromBytes(_requestData, _payeesPaymentAddress, _payerRefundAddress, _additionals);
    }

    /*
     * @dev Internal function to create, accept and add additionals to a request as Payer
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
        address mainPayee = extractAddress(_requestData, 41);
        require(msg.sender != mainPayee && mainPayee != 0);
        // creator must be the main payee
        require(extractAddress(_requestData, 0) == mainPayee);

        // extract the number of payees
        uint8 payeesCount = uint8(_requestData[40]);
        int256 totalExpectedAmounts = 0;
        for(uint8 i = 0; i < payeesCount; i++) {
            // extract the expectedAmount for the payee[i]
            int256 expectedAmountTemp = int256(extractBytes32(_requestData, uint256(i).mul(52).add(61)));
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
        updateBytes20inBytes(_requestData, 20, bytes20(msg.sender));
        // store request in the core
        requestId = requestCore.createRequestFromBytes(_requestData);
        
        // set bitcoin addresses
        extractAndStoreBitcoinAddresses(requestId, payeesCount, _payeesPaymentAddress, _payerRefundAddress);

        // accept and pay the request with the value remaining after the fee collect
        acceptAndAdditionals(requestId, _additionals);

        return requestId;
    }

    /*
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
    // -----------------------------------------------------------------------------

    /*
     * @dev Check the validity of a signed request & the expiration date
     * @param _data bytes containing all the data packed :
            address(creator)
            address(payer)
            uint8(number_of_payees)
            [
                address(main_payee_address)
                int256(main_payee_expected_amount)
                address(second_payee_address)
                int256(second_payee_expected_amount)
                ...
            ]
            uint8(data_string_size)
            size(data)
     * @param _payeesPaymentAddress array of payees payment addresses (the index 0 will be the payee the others are subPayees)
     * @param _expirationDate timestamp after that the signed request cannot be broadcasted
       * @param _signature ECDSA signature containing v, r and s as bytes
       *
     * @return Validity of order signature.
     */    
    function checkRequestSignature(
        bytes         _requestData,
        bytes         _payeesPaymentAddress,
        uint256       _expirationDate,
        bytes         _signature)
        public
        view
        returns (bool)
    {
        bytes32 hash = getRequestHash(_requestData, _payeesPaymentAddress, _expirationDate);

        // extract "v, r, s" from the signature
        uint8 v = uint8(_signature[64]);
        v = v < 27 ? v.add(27) : v;
        bytes32 r = extractBytes32(_signature, 0);
        bytes32 s = extractBytes32(_signature, 32);

        // check signature of the hash with the creator address
        return isValidSignature(extractAddress(_requestData, 0), hash, v, r, s);
    }

    /*
     * @dev Function internal to calculate Keccak-256 hash of a request with specified parameters
     *
     * @param _data bytes containing all the data packed
     * @param _payeesPaymentAddress array of payees payment addresses
     * @param _expirationDate timestamp after what the signed request cannot be broadcasted
     *
     * @return Keccak-256 hash of (this,_requestData, _payeesPaymentAddress, _expirationDate)
     */
    function getRequestHash(
        bytes       _requestData,
        bytes       _payeesPaymentAddress,
        uint256     _expirationDate)
        internal
        view
        returns(bytes32)
    {
        return keccak256(this,_requestData, _payeesPaymentAddress, _expirationDate);
    }

    /*
     * @dev Verifies that a hash signature is valid. 0x style
     * @param signer address of signer.
     * @param hash Signed Keccak-256 hash.
     * @param v ECDSA signature parameter v.
     * @param r ECDSA signature parameters r.
     * @param s ECDSA signature parameters s.
     * @return Validity of order signature.
     */
    function isValidSignature(
        address     signer,
        bytes32     hash,
        uint8       v,
        bytes32     r,
        bytes32     s)
        public
        pure
        returns (bool)
    {
        return signer == ecrecover(
            keccak256("\x19Ethereum Signed Message:\n32", hash),
            v,
            r,
            s
        );
    }

    /*
     * @dev extract an address in a bytes
     * @param data bytes from where the address will be extract
     * @param offset position of the first byte of the address
     * @return address
     */
    function extractAddress(bytes _data, uint offset)
        internal
        pure
        returns (address m) 
    {
        require(offset >=0 && offset + 20 <= _data.length);
        assembly {
            m := and( mload(add(_data, add(20, offset))), 
                      0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF)
        }
    }

    /*
     * @dev extract a bytes32 from a bytes
     * @param data bytes from where the bytes32 will be extract
     * @param offset position of the first byte of the bytes32
     * @return address
     */
    function extractBytes32(bytes _data, uint offset)
        public
        pure
        returns (bytes32 bs)
    {
        require(offset >=0 && offset + 32 <= _data.length);
        assembly {
            bs := mload(add(_data, add(32, offset)))
        }
    }

    /*
     * @dev modify 20 bytes in a bytes
     * @param data bytes to modify
     * @param offset position of the first byte to modify
     * @param b bytes20 to insert
     * @return address
     */
    function updateBytes20inBytes(bytes data, uint offset, bytes20 b)
        internal
        pure
    {
        require(offset >=0 && offset + 20 <= data.length);
        assembly {
            let m := mload(add(data, add(20, offset)))
            m := and(m, 0xFFFFFFFFFFFFFFFFFFFFFFFF0000000000000000000000000000000000000000)
            m := or(m, div(b, 0x1000000000000000000000000))
            mstore(add(data, add(20, offset)), m)
        }
    }

    /*
     * @dev extract a string from a bytes. Extracts a sub-part from tha bytes and convert it to string
     * @param data bytes from where the string will be extracted
     * @param size string size to extract
     * @param _offset position of the first byte of the string in bytes
     * @return string
     */ 
    function extractString(bytes data, uint8 size, uint _offset) 
        internal 
        pure 
        returns (string) 
    {
        bytes memory bytesString = new bytes(size);
        for (uint j = 0; j < size; j++) {
            bytesString[j] = data[_offset+j];
        }
        return string(bytesString);
    }
}
