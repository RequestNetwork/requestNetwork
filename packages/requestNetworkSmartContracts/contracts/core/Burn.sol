pragma solidity 0.4.18;

import "../vendor/KyberNetwork.sol";


/// @dev From https://github.com/KyberNetwork/smart-contracts/blob/master/contracts/ERC20Interface.sol
/// @dev Added burn function
interface BurnableErc20 {
    function totalSupply() public view returns (uint supply);
    function balanceOf(address _owner) public view returns (uint balance);
    function transfer(address _to, uint _value) public returns (bool success);
    function transferFrom(address _from, address _to, uint _value) public returns (bool success);
    function approve(address _spender, uint _value) public returns (bool success);
    function allowance(address _owner, address _spender) public view returns (uint remaining);
    function decimals() public view returns(uint digits);
    event Approval(address indexed _owner, address indexed _spender, uint _value);

    function burn(uint _value) public;
}


/// @title Burn contract. Converts the received ETH to and ERC20 and burn the converted ERC20.
/// @dev Used to burn the REQ fees. Request fees are paid in ETH. The ETH is sent by the 
///  currency contracts to this burn contract. When the burn contract is called, it converts
///  the ETH to REQ and burn the REQ.
/// @author Request Network
contract Burn {
    KyberNetwork public kyberContract;
    BurnableErc20 public desErc20;

    /// @param _destErc20 Destination token
    /// @param _kyberContract Kyber contract to use
    function Burn(address _destErc20, address _kyberContract) public {
        // Check inputs
        require(_destErc20 != address(0));
        require(_kyberContract != address(0));

        desErc20 = BurnableErc20(_destErc20);
        kyberContract = KyberNetwork(_kyberContract);
    }
    
    /// Fallback function to receive the ETH to burn later
    function() public payable { }

    /// @dev makes a trade between src and dest token and send dest token to destAddress
    /// @param maxSrcAmount amount of src tokens
    /// @param maxDestAmount A limit on the amount of dest tokens
    /// @param minConversionRate The minimal conversion rate. If actual rate is lower, trade is canceled.
    /// @return amount of actual dest tokens
    function doBurn(uint maxSrcAmount, uint maxDestAmount, uint minConversionRate)
        public
        returns(uint)
    {
        // ETH to convert on Kyber, by default the amount of ETH on the contract
        // If maxSrcAmount is defined, ethToConvert = min(balance on contract, maxSrcAmount)
        uint ethToConvert = this.balance;
        if (maxSrcAmount != 0 && maxSrcAmount < ethToConvert) {
            ethToConvert = maxSrcAmount;
        }

        // Convert the ETH to ERC20
        // erc20ToBurn is the amount of the ERC20 converted by Kyber that will be burned
        uint erc20ToBurn = kyberContract.trade.value(ethToConvert)(
            // Source. From Kyber docs, this value denotes ETH
            ERC20(0x00eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee),
            
            // Source amount. ETH to convert on Kyber, min(balance on contract, maxSrcAmount)
            ethToConvert,

            // Destination. Downcast BurnableErc20 => ERC20
            ERC20(desErc20),
            
            // destAddress,
            0,
            
            // maxDestAmount
            maxDestAmount,
            
            // minConversionRate
            minConversionRate,
            
            // walletId
            0
        );

        // Burn the ERC20
        desErc20.burn(erc20ToBurn);

        return erc20ToBurn;
    }
}
