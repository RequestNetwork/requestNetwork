pragma solidity ^0.4.11;


import './ERC20Basic.sol';


/**
 * @title ERC20 interface with no return for approve and transferFrom (like OMG token)
 * @dev see https://etherscan.io/address/0xd26114cd6EE289AccF82350c8d8487fedB8A0C07#code
 */
contract ERC20OMGLike is ERC20Basic {
  function allowance(address owner, address spender) public constant returns (uint256);
  function transferFrom(address from, address to, uint256 value) public;
  function approve(address spender, uint256 value) public;
  event Approval(address indexed owner, address indexed spender, uint256 value);
}
