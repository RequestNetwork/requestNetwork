// SPDX-License-Identifier: MIT
pragma solidity >=0.4.25 <0.7.0;


contract UsdtFake {
  function decimals() external pure returns (uint8) {
    return 6;
  }
}
