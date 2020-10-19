// SPDX-License-Identifier: MIT

pragma solidity ^0.5.0;

contract MockChainlinkETHUSD {
    function latestAnswer() external view returns (int256) {
        return 38089012251;
    }
}
