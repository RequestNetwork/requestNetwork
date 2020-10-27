// SPDX-License-Identifier: MIT

pragma solidity ^0.5.0;


contract MockChainlinkDAIUSD {
  function latestAnswer() external view returns (int256) {
    // mock of the rate from DAI to USD (8 decimals)
    return 101060000;
  }
}
