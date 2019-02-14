pragma solidity ^0.5.0;

import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "openzeppelin-solidity/contracts/ownership/Ownable.sol";

/**
 * @title StorageFeeCollector
 *
 * @notice StorageFeeCollector is a contract managing the fees
 */
contract StorageFeeCollector is Ownable {
  using SafeMath for uint256;

  /**
   * Fee computation for storage are based on four parameters:
   * minimumFee (wei) fee that will be applied for any size of storage
   * threshold (byte) minimum size from where the variable fee will be applied
   * rateFeesNumerator (wei) and rateFeesDenominator (byte) define the variable fee,
   * for each <rateFeesDenominator> bytes above threshold, <rateFeesNumerator> wei will be charged
   *
   * Example:
   * If the size to store is 50 bytes, the threshold is 100 bytes and the minimum fee is 300 wei,
   * then 300 will be charged
   *
   * If rateFeesNumerator is 2 and rateFeesDenominator is 1 then 2 wei will be charged for every bytes above threshold,
   * if the size to store is 150 bytes then the fee will be 300 + (150-100)*2 = 400 wei
   */
  uint256 public minimumFee;
  uint256 public rateFeesNumerator;
  uint256 public rateFeesDenominator;
  uint256 public threshold;

  // address of the contract that will burn req token
  address payable public requestBurnerContract;

  event UpdatedFeeParameters(uint256 minimumFee, uint256 rateFeesNumerator, uint256 rateFeesDenominator);
  event UpdatedMinimumFeeThreshold(uint256 threshold);
  event UpdatedBurnerContract(address burnerAddress);

  /**
   * @param _requestBurnerContract Address of the contract where to send the ether.
   * This burner contract will have a function that can be called by anyone and will exchange ether to req via Kyber and burn the REQ
   */  
  constructor(address payable _requestBurnerContract) 
    public
  {
    requestBurnerContract = _requestBurnerContract;
  }

  /**
    * @notice Sets the fees rate and minimum fee.
    * @dev if the _rateFeesDenominator is 0, it will be treated as 1. (in other words, the computation of the fees will not use it)
    * @param _minimumFee minimum fixed fee
    * @param _rateFeesNumerator numerator rate
    * @param _rateFeesDenominator denominator rate
    */  
  function setFeeParameters(uint256 _minimumFee, uint256 _rateFeesNumerator, uint256 _rateFeesDenominator)
    external
    onlyOwner
  {
    minimumFee = _minimumFee;
    rateFeesNumerator = _rateFeesNumerator;
    rateFeesDenominator = _rateFeesDenominator;
    emit UpdatedFeeParameters(minimumFee, rateFeesNumerator, rateFeesDenominator);
  }


  /**
    * @notice Sets the threshold from where the variable fee (rateFeesNumerator/rateFeesDenominator) will be applied
    * @param _threshold threshold
    */  
  function setMinimumFeeThreshold(uint256 _threshold)
    external
    onlyOwner
  {
    threshold = _threshold;
    emit UpdatedMinimumFeeThreshold(threshold);
  }


  /**
    * @notice Set the request burner address.
    * @param _requestBurnerContract address of the contract that will burn req token (probably through Kyber)
    */  
  function setRequestBurnerContract(address payable _requestBurnerContract) 
    external
    onlyOwner
  {
    requestBurnerContract = _requestBurnerContract;
    emit UpdatedBurnerContract(requestBurnerContract);
  }

  /**
    * @notice Computes the fees.
    * @param _dataSize Size of the data which hash is stored on storage
    * @return the expected amount of fees in wei
    */  
  function getFeesAmount(uint256 _dataSize)
    public
    view
    returns(uint256)
  {

    if (_dataSize <= threshold) {
      return minimumFee;
    } else {
      // Variable fees are applied to remaining size
      uint256 remainingSize = _dataSize.sub(threshold);
      uint256 computedCollect = remainingSize.mul(rateFeesNumerator);

      if (rateFeesDenominator != 0) {
        computedCollect = computedCollect.div(rateFeesDenominator);
      }

      return computedCollect.add(minimumFee);
    }
  }

  /**
    * @notice Sends fees to the request burning address.
    * @param _amount amount to send to the burning address
    */  
  function collectForREQBurning(uint256 _amount)
    internal
  {
    // .transfer throws on failure
    requestBurnerContract.transfer(_amount);
  }
}
