// SPDX-License-Identifier: MIT

pragma solidity ^0.5.0;


contract MockChainlinkUSDTETH {
  function latestAnswer() external view returns (int256) {
    // mock of the rate from USDT to ETH (18 decimals)
    return 2639000000000000;
  }
}
