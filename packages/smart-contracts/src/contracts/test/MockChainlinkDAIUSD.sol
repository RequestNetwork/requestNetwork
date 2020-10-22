// SPDX-License-Identifier: MIT

pragma solidity ^0.5.0;


contract MockChainlinkDAIUSD {
  function latestAnswer() external view returns (int256) {
    return 101060000;
  }
}
