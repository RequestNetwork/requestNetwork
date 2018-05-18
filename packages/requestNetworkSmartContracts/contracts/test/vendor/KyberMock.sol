pragma solidity ^0.4.18;


/// @dev From https://github.com/KyberNetwork/smart-contracts/blob/master/contracts/ERC20Interface.sol
interface ERC20 {
    function totalSupply() public view returns (uint supply);
    function balanceOf(address _owner) public view returns (uint balance);
    function transfer(address _to, uint _value) public returns (bool success);
    function transferFrom(address _from, address _to, uint _value) public returns (bool success);
    function approve(address _spender, uint _value) public returns (bool success);
    function allowance(address _owner, address _spender) public view returns (uint remaining);
    function decimals() public view returns(uint digits);
    event Approval(address indexed _owner, address indexed _spender, uint _value);
}


/// @title A mock contract for KyberNetwork, simplified to have only the trade() function
/// @author Request Network
/// @dev From https://github.com/KyberNetwork/smart-contracts/blob/master/contracts/KyberNetwork.sol
contract KyberMock {
    ERC20 constant internal ETH_TOKEN_ADDRESS = ERC20(0x00eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee);

    event ExecuteTrade(address indexed sender, ERC20 src, ERC20 dest, uint actualSrcAmount, uint actualDestAmount);

    /// @dev Mock contract to trade and ERC for another. 
    /// @dev Converts with a 1:1 conversion rate
    function trade(
        ERC20 src,
        uint srcAmount,
        ERC20 dest,
        
        address destAddress,
        uint maxDestAmount,
        uint minConversionRate,
        address walletId
    )
        external
        payable
        returns(uint)
    {
        // 1:1 rate
        uint actualSrcAmount = srcAmount;
        uint actualDestAmount = srcAmount;

        // Sends erc20 to the caller
        dest.transfer(msg.sender, actualDestAmount);

        ExecuteTrade(msg.sender, src, dest, actualSrcAmount, actualDestAmount);
        return actualDestAmount;
    }
}
