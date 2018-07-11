pragma solidity ^0.4.23;

import "../base/math/SafeMath.sol";
import "../base/ownership/Ownable.sol";

/**
 * @title FeeCollector
 *
 * @notice FeeCollector is a contract managing the fees for currency contracts
 */
contract FeeCollector is Ownable {
    using SafeMath for uint256;

    uint256 public rateFeesNumerator;
    uint256 public rateFeesDenominator;
    uint256 public maxFees;

    // address of the contract that will burn req token
    address public requestBurnerContract;

    event UpdateRateFees(uint256 rateFeesNumerator, uint256 rateFeesDenominator);
    event UpdateMaxFees(uint256 maxFees);

    /**
     * @param _requestBurnerContract Address of the contract where to send the ether.
     * This burner contract will have a function that can be called by anyone and will exchange ether to req via Kyber and burn the REQ
     */  
    constructor(address _requestBurnerContract) 
        public
    {
        requestBurnerContract = _requestBurnerContract;
    }

    /**
     * @notice Sends fees to the request burning address.
     * @param _amount amount to send to the burning address
     */  
    function collectForREQBurning(uint256 _amount)
        internal
        returns(bool)
    {
        return requestBurnerContract.send(_amount);
    }

    /**
     * @notice Computes the fees.
     * @param _expectedAmount amount expected for the request
     * @return the expected amount of fees in wei
     */  
    function collectEstimation(int256 _expectedAmount)
        public
        view
        returns(uint256)
    {
        if(_expectedAmount<0) return 0;

        uint256 computedCollect = uint256(_expectedAmount).mul(rateFeesNumerator);

        if(rateFeesDenominator != 0) {
            computedCollect = computedCollect.div(rateFeesDenominator);
        }

        return computedCollect < maxFees ? computedCollect : maxFees;
    }

    /**
     * @notice Sets the fees rate.
     * @dev if the _rateFeesDenominator is 0, it will be treated as 1. (in other words, the computation of the fees will not use it)
     * @param _rateFeesNumerator 		numerator rate
     * @param _rateFeesDenominator 		denominator rate
     */  
    function setRateFees(uint256 _rateFeesNumerator, uint256 _rateFeesDenominator)
        external
        onlyOwner
    {
        rateFeesNumerator = _rateFeesNumerator;
        rateFeesDenominator = _rateFeesDenominator;
        emit UpdateRateFees(rateFeesNumerator, rateFeesDenominator);
    }

    /**
     * @notice Sets the maximum fees in wei.
     * @param _newMaxFees new max
     */  
    function setMaxCollectable(uint256 _newMaxFees) 
        external
        onlyOwner
    {
        maxFees = _newMaxFees;
        emit UpdateMaxFees(maxFees);
    }

    /**
     * @notice Set the request burner address.
     * @param _requestBurnerContract address of the contract that will burn req token (probably through Kyber)
     */  
    function setRequestBurnerContract(address _requestBurnerContract) 
        external
        onlyOwner
    {
        requestBurnerContract = _requestBurnerContract;
    }

}
