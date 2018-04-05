pragma solidity ^0.4.18;


import "./StandardToken.sol";


/**
 * @title CentralBank token
 * @dev ERC20 token designed for testing, they have no value.
 * @dev Anyone can mint CTR tokens, the freshly minted tokens will be sent to the caller.
 * @dev Maximum 1000 tokens can be minted by call to mint()
 */
contract CentralBank is StandardToken {
    string public constant name = "Central Bank Token";
    string public constant symbol = "CTBK";
    uint8 public constant decimals = 18;

    function CentralBank(uint256 initialSupply) public {
        totalSupply = initialSupply;

        balances[msg.sender] = initialSupply;
        Transfer(address(0x0), msg.sender, totalSupply);
    }

    function mint(uint256 _quantity) external {
        uint256 quantity = _quantity <= 10e21 ? _quantity : 10e21;
        totalSupply += quantity;

        balances[msg.sender] += quantity;
        Transfer(address(0x0), msg.sender, totalSupply);
    }
}
