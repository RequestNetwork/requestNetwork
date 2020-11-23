// SPDX-License-Identifier: MIT
pragma solidity >=0.4.25 <0.7.0;

contract USDT_fake { 
  function decimals() external pure returns (uint8) {
      return 6;
  }
}
