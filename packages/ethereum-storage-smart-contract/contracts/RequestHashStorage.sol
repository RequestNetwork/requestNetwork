pragma solidity ^0.4.24;

import "./StorageFeeCollector.sol";

/**
 * @title RequestHashStorage
 * @notice Contract that stores ipfs hashes with event logs
 */
contract RequestHashStorage is StorageFeeCollector {

  /**
   * @param _addressBurner Burner address address
   */
  constructor(address _addressBurner) 
    StorageFeeCollector(_addressBurner)
    public
  {
  }

  // Event for submitted hashes
  event NewHash(string hash, uint size);

  /**
   * @notice Submit a new hash to the blockchain.
   *
   * @param _hash Hash of the request to be stored
   * @param _size Size of the request to be stored
   */
  function submitHash(string _hash, uint256 _size)
    external
    payable
  {
    // Check fees are paid
    require(getFeesAmount(_size) == msg.value);

    // Send fees to burner, throws on failure
    collectForREQBurning(msg.value);

    // Emit event for log
    emit NewHash(_hash, _size);
  }

  // Fallback function returns funds to the sender
  function() 
    public
    payable 
  { 
    revert();
  }
}
