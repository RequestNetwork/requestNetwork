// SPDX-License-Identifier: MIT

pragma solidity ^0.5.0;


contract MockChainlinkEURUSD {
  function latestAnswer() external view returns (int256) {
        // mock of the rate from EUR to USD (8 decimals)
    return 117736400;
  }
}
