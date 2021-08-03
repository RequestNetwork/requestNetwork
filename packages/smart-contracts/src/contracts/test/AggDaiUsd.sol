// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;


contract AggDaiUsd {
  function decimals() external pure returns (uint8) {
    return 8;
  }

  function latestAnswer() external pure returns (int256) {
    return 101000000;
  }

  function latestTimestamp() external view returns (uint256) {
    // one minute old
    return block.timestamp - 60;
  }
}
