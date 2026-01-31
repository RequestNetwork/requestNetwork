// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @title BadTRC20
 * @notice Non-standard TRC20 implementation for testing
 * @dev Similar to BadERC20 in EVM tests - implements ERC20 but with non-standard behavior
 */
contract BadTRC20 {
  string public name;
  string public symbol;
  uint8 public decimals;
  uint256 public totalSupply;

  mapping(address => uint256) public balanceOf;
  mapping(address => mapping(address => uint256)) public allowance;

  constructor(
    uint256 initialSupply,
    string memory name_,
    string memory symbol_,
    uint8 decimals_
  ) {
    name = name_;
    symbol = symbol_;
    decimals = decimals_;
    totalSupply = initialSupply;
    balanceOf[msg.sender] = initialSupply;
  }

  function transfer(address to, uint256 amount) public returns (bool) {
    require(balanceOf[msg.sender] >= amount, 'Insufficient balance');
    balanceOf[msg.sender] -= amount;
    balanceOf[to] += amount;
    return true;
  }

  function approve(address spender, uint256 amount) public returns (bool) {
    allowance[msg.sender][spender] = amount;
    return true;
  }

  // Note: No return value - this is the "bad" non-standard behavior
  function transferFrom(
    address from,
    address to,
    uint256 amount
  ) public {
    require(balanceOf[from] >= amount, 'Insufficient balance');
    require(allowance[from][msg.sender] >= amount, 'Insufficient allowance');
    balanceOf[from] -= amount;
    balanceOf[to] += amount;
    allowance[from][msg.sender] -= amount;
  }
}

/**
 * @title TRC20True
 * @notice TRC20 that always returns true from transferFrom
 * @dev Used to test tokens that always succeed
 */
contract TRC20True {
  function transferFrom(
    address,
    address,
    uint256
  ) public pure returns (bool) {
    return true;
  }
}
