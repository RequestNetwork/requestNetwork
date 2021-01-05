// SPDX-License-Identifier: MIT
pragma solidity >=0.4.25 <0.7.0;


contract AggDaiUsd {
  function decimals() external pure returns (uint8) {
    return 8;
  }

  function latestAnswer() external pure returns (int256) {
    return 101000000;
  }

  function latestTimestamp() external view returns (uint256) {
    return block.timestamp;
  }
}
