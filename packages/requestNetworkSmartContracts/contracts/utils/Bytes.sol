pragma solidity ^0.4.23;


/**
 * @title Bytes util library.
 * @notice Collection of utility functions to manipulate bytes for Request.
 */
library Bytes {
    /**
     * @notice Extracts an address in a bytes.
     * @param data bytes from where the address will be extract
     * @param offset position of the first byte of the address
     * @return address
     */
    function extractAddress(bytes data, uint offset)
        internal
        pure
        returns (address m) 
    {
        require(offset >= 0 && offset + 20 <= data.length, "offset value should be in the correct range");

        // solium-disable-next-line security/no-inline-assembly
        assembly {
            m := and(
                mload(add(data, add(20, offset))), 
                0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF
            )
        }
    }

    /**
     * @notice Extract a bytes32 from a bytes.
     * @param data bytes from where the bytes32 will be extract
     * @param offset position of the first byte of the bytes32
     * @return address
     */
    function extractBytes32(bytes data, uint offset)
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

    /**
     * @notice Modifies 20 bytes in a bytes.
     * @param data bytes to modify
     * @param offset position of the first byte to modify
     * @param b bytes20 to insert
     * @return address
     */
    function updateBytes20inBytes(bytes data, uint offset, bytes20 b)
        internal
        pure
    {
        require(offset >= 0 && offset + 20 <= data.length, "offset value should be in the correct range");

        // solium-disable-next-line security/no-inline-assembly
        assembly {
            let m := mload(add(data, add(20, offset)))
            m := and(m, 0xFFFFFFFFFFFFFFFFFFFFFFFF0000000000000000000000000000000000000000)
            m := or(m, div(b, 0x1000000000000000000000000))
            mstore(add(data, add(20, offset)), m)
        }
    }

    /**
     * @notice Extracts a string from a bytes. Extracts a sub-part from the bytes and convert it to string.
     * @param data bytes from where the string will be extracted
     * @param size string size to extract
     * @param _offset position of the first byte of the string in bytes
     * @return string
     */ 
    function extractString(bytes data, uint8 size, uint _offset) 
        internal 
        pure 
        returns (string) 
    {
        bytes memory bytesString = new bytes(size);
        for (uint j = 0; j < size; j++) {
            bytesString[j] = data[_offset+j];
        }
        return string(bytesString);
    }
}
