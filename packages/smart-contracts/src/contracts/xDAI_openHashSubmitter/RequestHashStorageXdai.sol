pragma solidity ^0.5.0;



/**
 * @title RequestHashStorage
 * @notice This contract is the entry point to retrieve all the hashes of the request network system.
  */
contract RequestHashStorage  {

  // Event to declare a new hash
  event NewHash(string hash, address hashSubmitter);

  // Fallback function returns funds to the sender
  function()
    external
  {
    revert("not payable fallback");
  }

  /**
   * @notice Declare a new hash
   * @param _hash hash to store
   * 
   */
  function declareNewHash(string calldata _hash)
    external
    
  {
    // Emit event for log
    emit NewHash(_hash, msg.sender);
  }
}
