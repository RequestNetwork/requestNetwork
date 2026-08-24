// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import '@openzeppelin/contracts/token/ERC20/IERC20.sol';

/**
 * @notice Minimal ERC-1271 wallet for recurring-proxy signature tests.
 */
contract MockERC1271 {
  bytes4 private constant _MAGICVALUE = 0x1626ba7e;

  address public immutable owner;

  constructor(address _owner) {
    owner = _owner;
  }

  function isValidSignature(bytes32 hash, bytes memory signature) external view returns (bytes4) {
    if (signature.length != 65) {
      return 0xffffffff;
    }

    bytes32 r;
    bytes32 s;
    uint8 v;
    // solhint-disable-next-line no-inline-assembly
    assembly {
      r := mload(add(signature, 32))
      s := mload(add(signature, 64))
      v := byte(0, mload(add(signature, 96)))
    }

    address recovered = ecrecover(hash, v, r, s);
    if (recovered != address(0) && recovered == owner) {
      return _MAGICVALUE;
    }
    return 0xffffffff;
  }

  function approveToken(
    address token,
    address spender,
    uint256 amount
  ) external {
    require(msg.sender == owner, 'MockERC1271: not owner');
    IERC20(token).approve(spender, amount);
  }
}
