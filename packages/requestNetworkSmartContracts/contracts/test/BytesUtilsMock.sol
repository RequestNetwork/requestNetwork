pragma solidity ^0.4.23;

import "../utils/Bytes.sol";


contract BytesUtilsMock {
    address public extractAddressResult;
    function extractAddress(bytes data, uint offset) public {
        extractAddressResult = Bytes.extractAddress(data, offset);
    }

    bytes32 public extractBytes32Result;
    function extractBytes32(bytes data, uint offset) public {
        extractBytes32Result = Bytes.extractBytes32(data, offset);
    }

    bytes public updateBytes20inBytesResult;
    function updateBytes20inBytes(bytes data, uint offset, bytes20 b) public {
        Bytes.updateBytes20inBytes(data, offset, b);
        updateBytes20inBytesResult = data;
    }

    string public extractStringResult;
    function extractString(bytes data, uint8 size, uint _offset) public {
        extractStringResult = Bytes.extractString(data, size, _offset);
    }
}
