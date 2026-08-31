// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import '@openzeppelin/contracts/token/ERC20/ERC20.sol';

/**
 * @notice ERC-20 that returns false on a failed transferFrom instead of reverting.
 */
contract ERC20SilentFail is ERC20 {
  constructor(uint256 initialSupply) ERC20('Silent Fail', 'SFL') {
    _mint(msg.sender, initialSupply);
  }

  function transferFrom(
    address from,
    address to,
    uint256 amount
  ) public override returns (bool) {
    uint256 currentAllowance = allowance(from, _msgSender());
    if (balanceOf(from) < amount || currentAllowance < amount) {
      return false;
    }
    _transfer(from, to, amount);
    _approve(from, _msgSender(), currentAllowance - amount);
    return true;
  }
}

/**
 * @notice ERC-20 that under-delivers on transferFrom (fee-on-transfer).
 */
contract ERC20FeeOnTransfer is ERC20 {
  constructor(uint256 initialSupply) ERC20('Fee On Transfer', 'FOT') {
    _mint(msg.sender, initialSupply);
  }

  function transferFrom(
    address from,
    address to,
    uint256 amount
  ) public override returns (bool) {
    require(amount > 1, 'ERC20FeeOnTransfer: amount');
    address spender = _msgSender();
    _spendAllowance(from, spender, amount);
    _transfer(from, to, amount - 1);
    _transfer(from, address(this), 1);
    return true;
  }
}

/**
 * @notice ERC-20 whose transfer() returns false so a relayer-fee payout can fail.
 */
contract ERC20FailTransfer is ERC20 {
  constructor(uint256 initialSupply) ERC20('Fail Transfer', 'FLT') {
    _mint(msg.sender, initialSupply);
  }

  function transfer(address, uint256) public pure override returns (bool) {
    return false;
  }
}

/**
 * @notice ERC-20 that reverts transfers to a chosen recipient so a batch leg can fail.
 */
contract ERC20BlockRecipient is ERC20 {
  address public blocked;

  constructor(uint256 initialSupply) ERC20('Block Recipient', 'BLK') {
    _mint(msg.sender, initialSupply);
  }

  function setBlocked(address account) external {
    blocked = account;
  }

  function _beforeTokenTransfer(
    address,
    address to,
    uint256
  ) internal view override {
    require(to != blocked, 'ERC20BlockRecipient: blocked');
  }
}
