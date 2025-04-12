// SPDX-License-Identifier: MIT
// Compatible with OpenZeppelin Contracts ^5.0.0
pragma solidity ^0.8.9;

import '@openzeppelin/contracts/token/ERC20/ERC20.sol';
import '@openzeppelin/contracts/access/Ownable.sol';
import '@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol';

contract TestToken is ERC20, Ownable, ERC20Permit {
  constructor(address initialOwner) ERC20('TestToken', 'TTK') Ownable() ERC20Permit('TestToken') {}

  function mint(address to, uint256 amount) public onlyOwner {
    _mint(to, amount);
  }
}
