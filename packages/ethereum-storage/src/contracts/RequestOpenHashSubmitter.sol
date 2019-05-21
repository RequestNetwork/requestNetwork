pragma solidity ^0.5.0;

import "./StorageFeeCollector.sol";
import "./RequestHashStorage.sol";
import "./Bytes.sol";


/**
 * @title RequestOpenHashSubmitter
 * @notice Contract declares data hashes and collects the fees.
 * @notice The hash is declared to the whole request network system through the RequestHashStorage contract.
 * @notice Anyone can submit hashes.
 */
contract RequestOpenHashSubmitter is StorageFeeCollector {

  RequestHashStorage public requestHashStorage;
  
  /**
   * @param _addressRequestHashStorage contract address which manages the hashes declarations
   * @param _addressBurner Burner address
   */
  constructor(address _addressRequestHashStorage, address payable _addressBurner)
    StorageFeeCollector(_addressBurner)
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
   * @notice Submit a new hash to the blockchain.
   *
   * @param _hash Hash of the request to be stored
   * @param _feesParameters fees parameters used to compute the fees. Here, it is the content size in an uint256
   */
  function submitHash(string calldata _hash, bytes calldata _feesParameters)
    external
    payable
  {
    // extract the contentSize from the _feesParameters
    uint256 contentSize = uint256(Bytes.extractBytes32(_feesParameters, 0));

    // Check fees are paid
    require(getFeesAmount(contentSize) == msg.value, "msg.value does not match the fees");

    // Send fees to burner, throws on failure
    collectForREQBurning(msg.value);

    // declare the hash to the whole system through to RequestHashStorage
    requestHashStorage.declareNewHash(_hash, _feesParameters);
  }
}
