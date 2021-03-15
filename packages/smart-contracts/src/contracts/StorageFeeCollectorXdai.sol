
pragma solidity ^0.5.0;

import "./SafeMath.sol";
import "./WhitelistAdminRole.sol";

/**
 * @title StorageFeeCollector
 * @dev :  contract for  providing the schematics of gas costs per hash and also to fetch the fees from the  wallet
 * 
 */
contract StorageFeeCollector is WhitelistAdminRole  {
  using SafeMath for uint256;

// parameters for defining the gas fees 
  uint256 public   minimumFee ; 
  uint256 public rateFeesNumerator;
  uint256 public rateFeesDenominator;

  
  // address of the contract that will spend Xdai token for the transaction.
  address payable public requestBurnerContract;
    
    
  ///@dev  for specifying the change in the parameters for gas fees based on the governance   
  event UpdatedFeeParameters(uint256 minimumFee, uint256 rateFeesNumerator, uint256 rateFeesDenominator);
  event UpdatedMinimumFeeThreshold(uint256 threshold);
  event UpdatedBurnerContract(address burnerAddress);


  /** @notice  initializing the fee collection object in open hash submitter. 
   * @param _requestLockContract Address of the  DAI lock based burner that will basically send the xDAI to be burned by swapping with REQ.
   * 
   */
  constructor(address payable _requestLockContract)
    public
  {
    requestBurnerContract = _requestLockContract;
  }

  

  /**
    * @notice Set the address of  new deploy wallet (  in case to be changed in future) .
    * 
    */
  function setWalletContract(address payable _newWalletContract)
    external
    onlyWhitelistAdmin
  {
    requestBurnerContract = _newWalletContract;
    emit UpdatedBurnerContract(requestBurnerContract);
  }

  /**
    * @notice sets the parameters that , along with size of the content , will determine final fees

    * @return the expected amount of fees (currently fixed) in gwei
    */
  function setFeeParameters(uint256 _minimumFee, uint256 _rateFeesNumerator, uint256 _rateFeesDenominator)
    public    
    returns(uint256)
  {
    // Transactions fee are computed based on the content size and the cost per txn from the request network.
    minimumFee = _minimumFee;
    rateFeesNumerator = _rateFeesNumerator;
    rateFeesDenominator = _rateFeesDenominator;
    emit UpdatedFeeParameters(minimumFee, rateFeesNumerator, rateFeesDenominator);

  }

/**
 * @dev computes the transaction based on the formula
 * 
 *  computedAllFee = (num(_contentSize))*(rateFeesNumerator/rateFeesDenominator)
 *   
 * @param _contentSize its the size of the request hash.
 * @return the total fees in wei.
 * 
*/  
  
    function getFeesAmount(uint256 _contentSize)
    public
    view
    returns(uint256)
  {
    // Transactions fee
    uint256 computedAllFee = _contentSize.mul(rateFeesNumerator);

    if (rateFeesDenominator != 0) {
      computedAllFee = computedAllFee.div(rateFeesDenominator);
    }

    if (computedAllFee <= minimumFee) {
      return minimumFee;
    } else {
      return computedAllFee;
    }
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
