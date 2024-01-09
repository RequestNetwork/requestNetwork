// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import '@openzeppelin/contracts/token/ERC20/IERC20.sol';

/**
 * @title LibSwap
 *
 * @notice LibSwap is a library storing swap specific data
 */
library LibSwap {
  bytes32 constant SWAP_STORAGE_POSITION = keccak256('swap.v1.storage');

  struct SwapStorage {
    address swapRouter;
  }

  // Return SwapStorage storage struct for reading and writing
  function getStorage() internal pure returns (SwapStorage storage storageStruct) {
    bytes32 position = SWAP_STORAGE_POSITION;
    assembly {
      storageStruct.slot := position
    }
  }

  function transferRemainingTokensBack(address[] memory _path) internal {
    IERC20 spentToken = IERC20(_path[0]);
    IERC20 requestedToken = IERC20(_path[_path.length - 1]);
    // Give the change back to the payer, in both currencies (only spent token should remain)
    if (spentToken.balanceOf(address(this)) > 0) {
      spentToken.transfer(msg.sender, spentToken.balanceOf(address(this)));
    }
    if (requestedToken.balanceOf(address(this)) > 0) {
      requestedToken.transfer(msg.sender, requestedToken.balanceOf(address(this)));
    }
  }
}
