// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @title TestTRC20
 * @notice Test TRC20 token for Tron network testing
 * @dev Minimal ERC20/TRC20 implementation for testing purposes
 */
contract TestTRC20 {
  string public name;
  string public symbol;
  uint8 public decimals;
  uint256 public totalSupply;

  mapping(address => uint256) public balanceOf;
  mapping(address => mapping(address => uint256)) public allowance;

  event Transfer(address indexed from, address indexed to, uint256 value);
  event Approval(address indexed owner, address indexed spender, uint256 value);

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
    emit Transfer(address(0), msg.sender, initialSupply);
  }

  function transfer(address to, uint256 amount) public returns (bool) {
    require(balanceOf[msg.sender] >= amount, 'Insufficient balance');
    balanceOf[msg.sender] -= amount;
    balanceOf[to] += amount;
    emit Transfer(msg.sender, to, amount);
    return true;
  }

  function approve(address spender, uint256 amount) public returns (bool) {
    allowance[msg.sender][spender] = amount;
    emit Approval(msg.sender, spender, amount);
    return true;
  }

  function transferFrom(
    address from,
    address to,
    uint256 amount
  ) public returns (bool) {
    require(balanceOf[from] >= amount, 'Insufficient balance');
    require(allowance[from][msg.sender] >= amount, 'Insufficient allowance');
    balanceOf[from] -= amount;
    balanceOf[to] += amount;
    allowance[from][msg.sender] -= amount;
    emit Transfer(from, to, amount);
    return true;
  }

  /**
   * @notice Mint new tokens - intentionally unrestricted for testing purposes
   * @dev This is a test contract; in production, this would require access control
   */
  function mint(address to, uint256 amount) external {
    totalSupply += amount;
    balanceOf[to] += amount;
    emit Transfer(address(0), to, amount);
  }
}

/**
 * @title TRC20NoReturn
 * @notice Non-standard TRC20 that doesn't return a value from transferFrom
 */
contract TRC20NoReturn {
  mapping(address => uint256) public balanceOf;
  mapping(address => mapping(address => uint256)) public allowance;

  constructor(uint256 initialSupply) {
    balanceOf[msg.sender] = initialSupply;
  }

  function transfer(address to, uint256 amount) public {
    require(balanceOf[msg.sender] >= amount, 'Insufficient balance');
    balanceOf[msg.sender] -= amount;
    balanceOf[to] += amount;
  }

  function approve(address spender, uint256 amount) public {
    allowance[msg.sender][spender] = amount;
  }

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
 * @title TRC20False
 * @notice TRC20 that always returns false from transferFrom
 */
contract TRC20False {
  function transferFrom(
    address,
    address,
    uint256
  ) public pure returns (bool) {
    return false;
  }
}

/**
 * @title TRC20Revert
 * @notice TRC20 that always reverts on transferFrom
 */
contract TRC20Revert {
  function transferFrom(
    address,
    address,
    uint256
  ) public pure {
    revert('TRC20Revert: transfer failed');
  }
}
