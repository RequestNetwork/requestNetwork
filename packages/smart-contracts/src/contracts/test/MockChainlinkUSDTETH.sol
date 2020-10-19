// SPDX-License-Identifier: MIT

pragma solidity ^0.5.0;

contract MockChainlinkUSDTETH {
    function latestAnswer() external view returns (int256) {
        return 2639000000000000;
    }
}
