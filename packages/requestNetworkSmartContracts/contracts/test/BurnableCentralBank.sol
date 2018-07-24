pragma solidity ^0.4.18;


import "../base/token/CentralBank.sol";


/**
 * @title Burnable CentralBank token
 * @dev Version of the CentralBank token with a burn function
 */
contract BurnableCentralBank is CentralBank {
    constructor(uint256 initialSupply) public CentralBank(initialSupply) {}

    function burn(uint value) public {
        balances[msg.sender] -= value;
        totalSupply -= value;
    }
}
