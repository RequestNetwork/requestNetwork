pragma solidity ^0.5.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/**
 * @title TestSwapRouter
 *
 * @notice TestSwapRouter is a contract to test swap to pay
*/
contract FakeSwapRouter {
  constructor() public {
  }

  function swapTokensForExactTokens(
        uint amountOut,
        uint amountInMax,
        address[] calldata path,
        address to,
        uint deadline
    ) external virtual override ensure(deadline) returns (uint[] memory amounts) {
      ERC20 swapped = new ERC20(path[1]);
      amounts = [amountInMax, amountInMax * 1.015];
      require(amounts[0] <= amountInMax, 'UniswapV2Router: EXCESSIVE_INPUT_AMOUNT');
      safeTransferFrom(
          path[0], msg.sender, address(this), amounts[0]
      );
      swapped.transfer(msg.sender, amounts[1]);
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
