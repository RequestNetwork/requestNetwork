pragma solidity ^0.5.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/**
 * @title TestSwapRouter
 *
 * @notice TestSwapRouter is a contract to test swap to pay
 * cf. https://github.com/Uniswap/uniswap-v2-periphery/blob/master/contracts/UniswapV2Router02.sol
*/
contract FakeSwapRouter {
  constructor() public {
  }

  modifier ensure(uint deadline) {
    require(deadline >= block.timestamp, 'UniswapV2Router: EXPIRED');
    _;
  }

  // Will fail if amountInMax < 2 * amountOut
  function swapTokensForExactTokens(
        uint amountOut,
        uint amountInMax,
        address[] calldata path,
        address to,
        uint deadline
    ) external ensure(deadline) returns (uint[] memory amounts) {
      amounts = new uint[](2);
      amounts[0] = amountOut;
      amounts[1] = amountOut * 2;
      //amounts = [amountOut, amountOut * 2];
      require(amounts[1] <= amountInMax, 'UniswapV2Router: EXCESSIVE_INPUT_AMOUNT');
      ERC20 swapped = ERC20(path[1]);
      require(swapped.balanceOf(address(this)) > amounts[0], 'Test cannot proceed, lack of tokens in fake swap contract');
      safeTransferFrom(
          path[0], address(this), amounts[1]
      );
      swapped.transfer(to, amounts[0]);
  }

  function safeTransferFrom(address _tokenAddress, address _to, uint256 _amount) internal returns (bool result) {
    /* solium-disable security/no-inline-assembly */
    // check if the address is a contract
    assembly {
      if iszero(extcodesize(_tokenAddress)) { revert(0, 0) }
    }
    
    // solium-disable-next-line security/no-low-level-calls
    (bool success, ) = _tokenAddress.call(abi.encodeWithSignature(
      "transferFrom(address,address,uint256)",
      msg.sender,
      _to,
      _amount
    ));

    assembly {
        switch returndatasize()
        case 0 { // not a standard erc20
            result := 1
        }
        case 32 { // standard erc20
            returndatacopy(0, 0, 32)
            result := mload(0)
        }
        default { // anything else, should revert for safety
            revert(0, 0)
        }
    }

    require(success, "transferFrom() has been reverted");

    /* solium-enable security/no-inline-assembly */
    return result;
  }
}
