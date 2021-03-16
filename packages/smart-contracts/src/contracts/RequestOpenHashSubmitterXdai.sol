pragma solidity ^0.5.0;

import "./StorageFeeCollectorXdai.sol";
import "./Bytes.sol";
import "./WhitelistAdminRole.sol";
import "./RequestHashStorageXdai.sol";
/**
 * @title RequestOpenHashSubmitter on xDAI. 
 * @notice Contract declares data hashes after being called from  Lock from open Hash submitter.
 * @notice Anyone can submit hashes.
 * @notice  in case of deploying the contracts by your side , the order of deployment should be follows : RequestHashStorageXdai ---> RequestOpenHashSubmitterXdai --> StorageFeeCollectorXdai 
 * @author : Dhruv , request network 
 */
 
 
 
contract RequestOpenHashSubmitter is StorageFeeCollector    {

  RequestHashStorage public requestHashStorage;
  
  /**
   * @param _addressRequestHashStorage contract address which manages the hashes declarations
   * @param _addressWallet  : dev wallet which will pay for the gas fees .
   */
  constructor(address _addressRequestHashStorage, address payable _addressWallet)
    StorageFeeCollector(_addressWallet)
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
   *@param _feesParameters they are byte representation of parameters used to define the totalFees
    *
   */
  function submitHash(string calldata _hash , bytes calldata _feesParameters)
    external
    payable
  {
        // parsing the contentsize from the fees param from the requestnetqork library
      uint256 contentSize = uint256(Bytes.extractBytes32(_feesParameters, 0));

      
    // Check fees are paid
    require(getFeesAmount(contentSize) == msg.value, "msg.value does not match the fees");

    
    // Send  fees to burner from , throws on failure
    collectForXdaiBurning(msg.value);

    // declare the hash to the whole xDAI blockchain to be validated and also the fees params for verification.
    requestHashStorage.declareNewHash(_hash,_feesParameters);
  }
}
