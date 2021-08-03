// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/AccessControl.sol";

/**
 * @title RequestHashStorage
 * @notice This contract is the entry point to retrieve all the hashes of the request network system.
  */
contract RequestHashStorage is AccessControl {

  bytes32 PUBLISHER_ROLE = "PUBLISHER";

  // Event to declare a new hash
  event NewHash(string hash, address hashSubmitter, bytes feesParameters);

  // Fallback function returns funds to the sender
  fallback()
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
    onlyRole(PUBLISHER_ROLE)
  {
    // Emit event for log
    emit NewHash(_hash, msg.sender, _feesParameters);
  }
}
