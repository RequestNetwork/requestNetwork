pragma solidity ^0.5.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "./lib/SafeERC20.sol";

/**
 * @title TestSwapRouter
 *
 * @notice TestSwapRouter is a contract to test swap to pay
 * cf. https://github.com/Uniswap/uniswap-v2-periphery/blob/master/contracts/UniswapV2Router02.sol
*/
contract FakeSwapRouter {
  using SafeERC20 for ERC20;

  modifier ensure(uint deadline) {
    require(deadline >= block.timestamp, "UniswapV2Router: EXPIRED");
    _;
  }

  // Will fail if amountInMax < 2 * amountOut
  function swapTokensForExactTokens(
    uint amountOut,
    uint amountInMax,
    address[] calldata path,
    address to,
    uint deadline
  ) external ensure(deadline) returns (uint[] memory amounts) 
  {
    amounts = new uint[](2);
    amounts[0] = amountOut;
    amounts[1] = amountOut * 2;
    //amounts = [amountOut, amountOut * 2];
    require(amounts[1] <= amountInMax, "UniswapV2Router: EXCESSIVE_INPUT_AMOUNT");
    ERC20 paid = ERC20(path[0]);
    ERC20 swapped = ERC20(path[1]);
    require(swapped.balanceOf(address(this)) > amounts[0], "Test cannot proceed, lack of tokens in fake swap contract");
    paid.safeTransferFrom(msg.sender, address(this), amounts[1]);
    swapped.transfer(to, amounts[0]);
  }
}
