// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/**
 * @title TestERC20
 *
 * @notice TestERC20 is a contract to test ERC20 detection
*/
contract TestERC20 is ERC20 {
  constructor(uint256 initialSupply) ERC20("ERC 20", "ERC20") {
    _mint(msg.sender, initialSupply);
    transfer(0xf17f52151EbEF6C7334FAD080c5704D77216b732, 10);
  }
}


contract ERC20True {
  function transferFrom(address, address, uint) pure public returns (bool) {
    return true;
  }
}


contract ERC20False {
  function transferFrom(address, address, uint) pure public returns (bool) {
    return false;
  }
}


contract ERC20NoReturn {
  function transferFrom(address _from, address _to, uint _value) pure public {}
}


contract ERC20Revert {
  function transferFrom(address, address, uint) pure public {
    revert("bad thing happened");
  }
}

contract ERC20Alpha is ERC20 {
  constructor(uint256 initialSupply) ERC20("Alpha ERC 20", "ALPHA") {
    _mint(msg.sender, initialSupply);
  }
}