pragma solidity ^0.5.0;


/**
 * @title Bytes util library.
 * @notice Collection of utility functions to manipulate bytes for Request.
 */
library Bytes {
  /**
    * @notice Extract a bytes32 from a bytes.
    * @param data bytes from where the bytes32 will be extract
    * @param offset position of the first byte of the bytes32
    * @return address
    */
  function extractBytes32(bytes memory data, uint offset)
    internal
    pure
    returns (bytes32 bs)
  {
    require(offset >= 0 && offset + 32 <= data.length, "offset value should be in the correct range");

    // solium-disable-next-line security/no-inline-assembly
    assembly {
        bs := mload(add(data, add(32, offset)))
    }
  }
}
