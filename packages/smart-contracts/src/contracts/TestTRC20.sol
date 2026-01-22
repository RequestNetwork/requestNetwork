// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import '@openzeppelin/contracts/token/ERC20/ERC20.sol';

/**
 * @title TestTRC20
 * @notice Test TRC20 token for Tron network testing
 * @dev This contract is used for testing the ERC20FeeProxy on Tron.
 *      TRC20 is Tron's equivalent of ERC20 and is ABI-compatible.
 */
contract TestTRC20 is ERC20 {
  uint8 private _decimals;

  /**
   * @param initialSupply The initial token supply to mint to deployer
   * @param name_ Token name
   * @param symbol_ Token symbol
   * @param decimals_ Number of decimals (typically 6 for USDT-TRC20, 18 for others)
   */
  constructor(
    uint256 initialSupply,
    string memory name_,
    string memory symbol_,
    uint8 decimals_
  ) ERC20(name_, symbol_) {
    _decimals = decimals_;
    _mint(msg.sender, initialSupply);
  }

  /**
   * @notice Returns the number of decimals used for display purposes
   */
  function decimals() public view virtual override returns (uint8) {
    return _decimals;
  }

  /**
   * @notice Mint additional tokens (for testing purposes only)
   * @param to Address to mint tokens to
   * @param amount Amount of tokens to mint
   */
  function mint(address to, uint256 amount) external {
    _mint(to, amount);
  }
}

/**
 * @title TRC20NoReturn
 * @notice Non-standard TRC20 that doesn't return a value from transferFrom
 * @dev Used to test compatibility with non-standard tokens on Tron
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

  // Note: No return value - this is intentional for testing
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
 * @dev Used to test error handling for failed transfers
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
 * @dev Used to test error handling for reverting transfers
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
