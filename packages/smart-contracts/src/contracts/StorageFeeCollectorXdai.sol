
pragma solidity ^0.5.0;

import "./lib/SafeMath.sol";
import "./lib/WhitelistAdminRole.sol";

/**
 * @title StorageFeeCollector
 * @dev :  contract for  providing the schematics of gas costs per hash and also to fetch the fees from the  wallet
 * @dev steps for getting the storage fee collector being deployed 
 * @dev 1. deploy the open hash submitter contract 
 * @dev 2. add the address of the wallet  which will have necessary reserve of xDAI for paying the fees.
 */
contract StorageFeeCollector is WhitelistAdminRole  {
  using SafeMath for uint256;

// parameters for defining the gas fees 
  uint256 public   minimumFee ; 
  uint256 public rateFeesNumerator;
  uint256 public rateFeesDenominator;

  
  // address of the contract that will spend Xdai token for the transaction.
  address payable  WalletAddress;
  // address of the open hash submitter contracts 
  address payable requestOpenHashContract;
    
  ///@dev  for specifying the change in the parameters for gas fees based on the governance   
  event UpdatedFeeParameters(uint256 minimumFee, uint256 rateFeesNumerator, uint256 rateFeesDenominator);
  event UpdatedMinimumFeeThreshold(uint256 threshold);
  event UpdatedWalletAddress(address burnerAddress);


  /** @notice  initializing the  object  for paying for hash submissions in  open hash submitter. 
   * @param _requestOpenHashContract  Address of the Open hash submittter where to send the transaction.
   * 
   */
  constructor(address payable _requestOpenHashContract)
    public
  {
    requestOpenHashContract = _requestOpenHashContract;
  }

  

  /**
    * @notice Set the address of  wallet to pay fees  .
    * 
    */
  function setWalletContract(address payable _newWalletContract)
    external
    onlyWhitelistAdmin
  {
    WalletAddress = _newWalletContract;
    emit UpdatedWalletAddress(WalletAddress);
  }

  /**
    * @notice sets the parameters that , along with size of the content , will determine final fees
    * @param _minimumFee thats the minimum fee that  will be  applicable in case of  no content 
    * @param _rateFeesNumerator param that increases the relevant contribution of contentsize in the computing the total fees
    * @param _rateFeesDenominator param that decreases  the relevant contribution of contentsize in the computing the total fees
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
 *  computedAllFee = (num(_contentSize))*(rateFeesNumerator/rateFeesDenominator) + _minimumFee
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
    WalletAddress.transfer(_amount);
  }
}
