// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface ISwapRouter {
  function swapTokensForExactTokens(
    uint256 amountOut,
    uint256 amountInMax,
    address[] calldata path,
    address to,
    uint256 deadline
  ) external returns (uint256[] memory amounts);
}
