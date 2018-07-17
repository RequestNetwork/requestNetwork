pragma solidity ^0.4.23;

import "./Bytes.sol";
import "../base/math/SafeMath.sol";
import "../base/math/SafeMathInt.sol";
import "../base/math/SafeMathUint8.sol";


/**
 * @title Request Signature util library.
 * @notice Collection of utility functions to handle Request signatures.
 */
library Signature {
    using SafeMath for uint256;
    using SafeMathInt for int256;
    using SafeMathUint8 for uint8;

    /**
     * @notice Checks the validity of a signed request & the expiration date.
     * @param requestData bytes containing all the data packed :
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
     * @param payeesPaymentAddress array of payees payment addresses (the index 0 will be the payee the others are subPayees)
     * @param expirationDate timestamp after that the signed request cannot be broadcasted
     * @param signature ECDSA signature containing v, r and s as bytes
     *
     * @return Validity of order signature.
     */	
    function checkRequestSignature(
        bytes 		requestData,
        address[] 	payeesPaymentAddress,
        uint256 	expirationDate,
        bytes 		signature)
        internal
        view
        returns (bool)
    {
        bytes32 hash = getRequestHash(requestData, payeesPaymentAddress, expirationDate);

        // extract "v, r, s" from the signature
        uint8 v = uint8(signature[64]);
        v = v < 27 ? v.add(27) : v;
        bytes32 r = Bytes.extractBytes32(signature, 0);
        bytes32 s = Bytes.extractBytes32(signature, 32);

        // check signature of the hash with the creator address
        return isValidSignature(
            Bytes.extractAddress(requestData, 0),
            hash,
            v,
            r,
            s
        );
    }

    /**
     * @notice Checks the validity of a Bitcoin signed request & the expiration date.
     * @param requestData bytes containing all the data packed :
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
     * @param payeesPaymentAddress array of payees payment addresses (the index 0 will be the payee the others are subPayees)
     * @param expirationDate timestamp after that the signed request cannot be broadcasted
     * @param signature ECDSA signature containing v, r and s as bytes
     *
     * @return Validity of order signature.
     */	
    function checkBtcRequestSignature(
        bytes 		requestData,
        bytes 	    payeesPaymentAddress,
        uint256 	expirationDate,
        bytes 		signature)
        internal
        view
        returns (bool)
    {
        bytes32 hash = getBtcRequestHash(requestData, payeesPaymentAddress, expirationDate);

        // extract "v, r, s" from the signature
        uint8 v = uint8(signature[64]);
        v = v < 27 ? v.add(27) : v;
        bytes32 r = Bytes.extractBytes32(signature, 0);
        bytes32 s = Bytes.extractBytes32(signature, 32);

        // check signature of the hash with the creator address
        return isValidSignature(
            Bytes.extractAddress(requestData, 0),
            hash,
            v,
            r,
            s
        );
    }
    
    /**
     * @notice Calculates the Keccak-256 hash of a BTC request with specified parameters.
     *
     * @param requestData bytes containing all the data packed
     * @param payeesPaymentAddress array of payees payment addresses
     * @param expirationDate timestamp after what the signed request cannot be broadcasted
     *
     * @return Keccak-256 hash of (this, requestData, payeesPaymentAddress, expirationDate)
     */
    function getBtcRequestHash(
        bytes 		requestData,
        bytes 	payeesPaymentAddress,
        uint256 	expirationDate)
        private
        view
        returns(bytes32)
    {
        return keccak256(
            this,
            requestData,
            payeesPaymentAddress,
            expirationDate
        );
    }

    /**
     * @dev Calculates the Keccak-256 hash of a (not BTC) request with specified parameters.
     *
     * @param requestData bytes containing all the data packed
     * @param payeesPaymentAddress array of payees payment addresses
     * @param expirationDate timestamp after what the signed request cannot be broadcasted
     *
     * @return Keccak-256 hash of (this, requestData, payeesPaymentAddress, expirationDate)
     */
    function getRequestHash(
        bytes 		requestData,
        address[] 	payeesPaymentAddress,
        uint256 	expirationDate)
        private
        view
        returns(bytes32)
    {
        return keccak256(
            this,
            requestData,
            payeesPaymentAddress,
            expirationDate
        );
    }
    
    /**
     * @notice Verifies that a hash signature is valid. 0x style.
     * @param signer address of signer.
     * @param hash Signed Keccak-256 hash.
     * @param v ECDSA signature parameter v.
     * @param r ECDSA signature parameters r.
     * @param s ECDSA signature parameters s.
     * @return Validity of order signature.
     */
    function isValidSignature(
        address signer,
        bytes32 hash,
        uint8 	v,
        bytes32 r,
        bytes32 s)
        private
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
}
