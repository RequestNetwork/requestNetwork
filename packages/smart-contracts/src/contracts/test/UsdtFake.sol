// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract UsdtFake {
  mapping(address => uint256) private _balances;
  mapping(address => mapping(address => uint256)) private _allowances;
  uint256 private _totalSupply;

  function decimals() external pure returns (uint8) {
    return 6;
  }

  function totalSupply() external view returns (uint256) {
    return _totalSupply;
  }

  function balanceOf(address account) external view returns (uint256) {
    return _balances[account];
  }

  // Non-standard: no return value
  function transfer(address recipient, uint256 amount) external {
    _transfer(msg.sender, recipient, amount);
  }

  function allowance(address owner, address spender) external view returns (uint256) {
    return _allowances[owner][spender];
  }

  // Non-standard: no return value
  function approve(address spender, uint256 amount) external {
    _approve(msg.sender, spender, amount);
  }

  // Non-standard: no return value
  function transferFrom(address sender, address recipient, uint256 amount) external {
    _transfer(sender, recipient, amount);
    uint256 currentAllowance = _allowances[sender][msg.sender];
    require(currentAllowance >= amount, 'ERC20: transfer amount exceeds allowance');
    unchecked {
      _approve(sender, msg.sender, currentAllowance - amount);
    }
  }

  function _transfer(address sender, address recipient, uint256 amount) internal {
    require(sender != address(0), 'ERC20: transfer from the zero address');
    require(recipient != address(0), 'ERC20: transfer to the zero address');
    uint256 senderBalance = _balances[sender];
    require(senderBalance >= amount, 'ERC20: transfer amount exceeds balance');
    unchecked {
      _balances[sender] = senderBalance - amount;
    }
    _balances[recipient] += amount;
  }

  function _approve(address owner, address spender, uint256 amount) internal {
    require(owner != address(0), 'ERC20: approve from the zero address');
    require(spender != address(0), 'ERC20: approve to the zero address');
    _allowances[owner][spender] = amount;
  }

  // For testing purposes
  function mint(address account, uint256 amount) external {
    _totalSupply += amount;
    _balances[account] += amount;
  }
}
