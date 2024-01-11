// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import '../interfaces/IRequestApp.sol';

/**
 * @title BaseRequestApp
 * @notice Base Request application. Extends th
 */
abstract contract BaseRequestApp is IRequestApp {
  /**
   * @notice See ERC165
   */
  function supportsInterface(bytes4 interfaceId) public pure returns (bool) {
    return interfaceId == type(IERC165).interfaceId || interfaceId == type(IRequestApp).interfaceId;
  }
}
