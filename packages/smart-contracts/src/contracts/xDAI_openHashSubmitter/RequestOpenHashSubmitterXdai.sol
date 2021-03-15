pragma solidity ^0.5.0;

import "./StorageFeeCollectorXdai.sol";
import "./RequestHashStorageXdai.sol";
import "./Bytes.sol";

/**
 * @title RequestOpenHashSubmitter on xDAI. 
 * @notice Contract declares data hashes after being called from  Lock from open Hash submitter.
 * @notice Anyone can submit hashes.
 * @author : Dhruv , request network 
 */
contract RequestOpenHashSubmitter is StorageFeeCollector  {

  RequestHashStorage public requestHashStorage;
  
  /**
   * @param _addressRequestHashStorage contract address which manages the hashes declarations
   * @param _addressXdaiLock daiLock burner : 0x2cfa65dcb34311293c6a52f1d7beb8f4e31e5117.
   */
  constructor(address _addressRequestHashStorage, address payable _addressXdaiLock)
    StorageFeeCollector(_addressXdaiLock)
    public
  {
    requestHashStorage = RequestHashStorage(_addressRequestHashStorage);
  }

  // Fallback function returns funds to the sender
  function()
    external
    payable
  {
    revert("not payable fallback");
  }

  /**
   * @notice Submit a new hash to the xDai blockchain.
   *@param _hash Hash of the request to be stored
   *@param _gasFees transferred for the payment of the hash deployment 

   */
  function submitHash(string calldata _hash , uint256 _gasFees)
    external
    payable
  {
    
    
    // Send  fees to burner from , throws on failure
    collectForXdaiBurning(_gasFees);

    // declare the hash to the whole system through to RequestHashStorage
    requestHashStorage.declareNewHash(_hash);
  }
}
