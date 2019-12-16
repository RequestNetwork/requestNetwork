pragma solidity ^0.5.0;

import "openzeppelin-solidity/contracts/access/roles/WhitelistedRole.sol";


/**
 * @title RequestHashStorage
 * @notice This contract is the entry point to retrieve all the hashes of the request network system.
  */
contract RequestHashStorage is WhitelistedRole {

  // Event to declare a new hash
  event NewHash(string hash, address hashSubmitter, bytes feesParameters);

  // Fallback function returns funds to the sender
  function()
    external
  {
    revert("not payable fallback");
  }

  /**
   * @notice Declare a new hash
   * @param _hash hash to store
   * @param _feesParameters Parameters use to compute the fees. This is a bytes to stay generic, the structure is on the charge of the hashSubmitter contracts.
   */
  function declareNewHash(string calldata _hash, bytes calldata _feesParameters)
    external
    onlyWhitelisted
  {
    // Emit event for log
    emit NewHash(_hash, msg.sender, _feesParameters);
  }
}
