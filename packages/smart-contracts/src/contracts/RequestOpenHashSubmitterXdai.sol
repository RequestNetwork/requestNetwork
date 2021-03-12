
pragma solidity ^0.5.0;

import "./SafeMath.sol";


/**
 * @title StorageFeeCollector
 * @dev : an lodified  contract for  providing the fees needed for xDAI burning and changing the EOA address for payment of the fees
 * @notice StorageFeeCollector is a contract managing the fees
 */
contract StorageFeeCollector   {
  using SafeMath for uint256;

  /**
   * @notice all the fee computation work is being removed , given that
   */
  uint256 public constant  minimumFee = 10000000000000000000; //10gwei
  
  // address of the contract that will spend Xdai token for the transaction.
  address payable public requestBurnerContract;

  event UpdatedBurnerContract(address burnerAddress);

  /**
   * @param _requestLockContract Address of the contract  where to send the xDAI for invoices hash deployment 
   * 
   */
  constructor(address payable _requestLockContract)
    public
  {
    requestBurnerContract = _requestLockContract;
  }

  

  /**
    * @notice Set the request for setting up the proxy EOA for xDAI.
    * @param _requestBurnerContract address of the contract that will burn xdai for the transactions 
    */
  function setRequestBurnerContract(address payable _requestBurnerContract)
    external
    
  {
    requestBurnerContract = _requestBurnerContract;
    emit UpdatedBurnerContract(requestBurnerContract);
  }

  /**
    * @notice Computes the fees.

    * @return the expected amount of fees (currently fixed) in gwei
    */
  function getFeesAmount()
    public
    pure
    returns(uint256)
  {
    // Transactions fee , as xDAI gas requirements  being  independent on the gas costs based upon the size .
    uint256 computedAllFee = 10;

    
   return computedAllFee;
  }

  /**
    * @notice Sends fees to the request burning address.
    * @param _amount amount to send to the burning address
    */
  function collectForXdaiBurning(uint256 _amount)
    internal
  {
    // .transfer throws on failure
    requestBurnerContract.transfer(_amount);
  }
}
