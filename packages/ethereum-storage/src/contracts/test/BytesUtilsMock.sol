pragma solidity ^0.5.0;

import "../Bytes.sol";


contract BytesUtilsMock {
  bytes32 public extractBytes32Result;
  function extractBytes32(bytes memory data, uint offset) public {
    extractBytes32Result = Bytes.extractBytes32(data, offset);
  }
}
