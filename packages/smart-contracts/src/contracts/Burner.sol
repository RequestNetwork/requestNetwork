pragma solidity ^0.4.18;

import "../base/lifecycle/Destructible.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "./Uniswapv2Router02.sol";


/// @dev From https://github.com/KyberNetwork/smart-contracts/blob/master/contracts/ERC20Interface.sol
/// @dev with additional burn function
interface ERC20 {
    function totalSupply() external view returns (uint supply);
    function balanceOf(address _owner) external view returns (uint balance);
    function transfer(address _to, uint _value) external returns (bool success);
    function transferFrom(address _from, address _to, uint _value) external returns (bool success);
    function approve(address _spender, uint _value) external returns (bool success);
    function allowance(address _owner, address _spender) external view returns (uint remaining);
    function decimals() external view returns(uint digits);
    event Approval(address indexed _owner, address indexed _spender, uint _value);
}


/// @title Contract for a burnable ERC
contract BurnableErc20 is ERC20 {
    function burn(uint value) external;
}


/// @title Interface for Kyber contract
contract KyberNetwork {
    function trade(
        ERC20 src,
        uint srcAmount,
        ERC20 dest,
        address destAddress,
        uint maxDestAmount,
        uint minConversionRate,
        address walletId
    )
        public
        payable
        returns(uint);
}

///@trying to get the same for the Uniswap

contract UniswapV2Router02 {
    function _swap(uint[] memory amounts, address[] memory path, address _to );

            for (uint i; i < path.length - 1; i++) {
            (address input, address output) = (path[i], path[i + 1]);
            (address token0,) = UniswapV2Library.sortTokens(input, output);
            uint amountOut = amounts[i + 1];
            (uint amount0Out, uint amount1Out) = input == token0 ? (uint(0), amountOut) : (amountOut, uint(0));
            address to = i < path.length - 2 ? UniswapV2Library.pairFor(factory, output, path[i + 2]) : _to;
            IUniswapV2Pair(UniswapV2Library.pairFor(factory, input, output)).swap(
                amount0Out, amount1Out, to, new bytes(0)
            );
        }




}




/// @dev now converting based on the Uniswap  token . 
/// @ref https://uniswap.org/docs/v1/smart-contracts/interfaces/
interface UniswapExchangeInterface {
    // Address of ERC20 token sold on this exchange
    function tokenAddress() external view returns (address token);
    // Address of Uniswap Factory
    function factoryAddress() external view returns (address factory);
    // Provide Liquidity
    function addLiquidity(uint256 min_liquidity, uint256 max_tokens, uint256 deadline) external payable returns (uint256);
    function removeLiquidity(uint256 amount, uint256 min_eth, uint256 min_tokens, uint256 deadline) external returns (uint256, uint256);
    // Get Prices
    function getEthToTokenInputPrice(uint256 eth_sold) external view returns (uint256 tokens_bought);
    function getEthToTokenOutputPrice(uint256 tokens_bought) external view returns (uint256 eth_sold);
    function getTokenToEthInputPrice(uint256 tokens_sold) external view returns (uint256 eth_bought);
    function getTokenToEthOutputPrice(uint256 eth_bought) external view returns (uint256 tokens_sold);
    // Trade ETH to ERC20
    function ethToTokenSwapInput(uint256 min_tokens, uint256 deadline) external payable returns (uint256  tokens_bought);
    function ethToTokenTransferInput(uint256 min_tokens, uint256 deadline, address recipient) external payable returns (uint256  tokens_bought);
    function ethToTokenSwapOutput(uint256 tokens_bought, uint256 deadline) external payable returns (uint256  eth_sold);
    function ethToTokenTransferOutput(uint256 tokens_bought, uint256 deadline, address recipient) external payable returns (uint256  eth_sold);
    // Trade ERC20 to ETH
    function tokenToEthSwapInput(uint256 tokens_sold, uint256 min_eth, uint256 deadline) external returns (uint256  eth_bought);
    function tokenToEthTransferInput(uint256 tokens_sold, uint256 min_eth, uint256 deadline, address recipient) external returns (uint256  eth_bought);
    function tokenToEthSwapOutput(uint256 eth_bought, uint256 max_tokens, uint256 deadline) external returns (uint256  tokens_sold);
    function tokenToEthTransferOutput(uint256 eth_bought, uint256 max_tokens, uint256 deadline, address recipient) external returns (uint256  tokens_sold);
    // Trade ERC20 to ERC20
    function tokenToTokenSwapInput(uint256 tokens_sold, uint256 min_tokens_bought, uint256 min_eth_bought, uint256 deadline, address token_addr) external returns (uint256  tokens_bought);
    function tokenToTokenTransferInput(uint256 tokens_sold, uint256 min_tokens_bought, uint256 min_eth_bought, uint256 deadline, address recipient, address token_addr) external returns (uint256  tokens_bought);
    function tokenToTokenSwapOutput(uint256 tokens_bought, uint256 max_tokens_sold, uint256 max_eth_sold, uint256 deadline, address token_addr) external returns (uint256  tokens_sold);
    function tokenToTokenTransferOutput(uint256 tokens_bought, uint256 max_tokens_sold, uint256 max_eth_sold, uint256 deadline, address recipient, address token_addr) external returns (uint256  tokens_sold);
    // Trade ERC20 to Custom Pool
    function tokenToExchangeSwapInput(uint256 tokens_sold, uint256 min_tokens_bought, uint256 min_eth_bought, uint256 deadline, address exchange_addr) external returns (uint256  tokens_bought);
    function tokenToExchangeTransferInput(uint256 tokens_sold, uint256 min_tokens_bought, uint256 min_eth_bought, uint256 deadline, address recipient, address exchange_addr) external returns (uint256  tokens_bought);
    function tokenToExchangeSwapOutput(uint256 tokens_bought, uint256 max_tokens_sold, uint256 max_eth_sold, uint256 deadline, address exchange_addr) external returns (uint256  tokens_sold);
    function tokenToExchangeTransferOutput(uint256 tokens_bought, uint256 max_tokens_sold, uint256 max_eth_sold, uint256 deadline, address recipient, address exchange_addr) external returns (uint256  tokens_sold);
    // ERC20 comaptibility for liquidity tokens
    bytes32 public name;
    bytes32 public symbol;
    uint256 public decimals;
    function transfer(address _to, uint256 _value) external returns (bool);
    function transferFrom(address _from, address _to, uint256 value) external returns (bool);
    function approve(address _spender, uint256 _value) external returns (bool);
    function allowance(address _owner, address _spender) external view returns (uint256);
    function balanceOf(address _owner) external view returns (uint256);
    function totalSupply() external view returns (uint256);
    // Never use
    function setup(address token_addr) external;
}

/// @title Burner
/// @notice A contract to burn ERC20 tokens from ETH. Sends the ETH on the contract to Uniswap for conversion to ERC20.
///  The converted ERC20 is then burned.
/// @author Request Network
contract Burner is Destructible  {




    /// Kyber contract that will be used for the conversion
    UniswapV2Router02 public UniswapContract;
    KyberNetwork public kyberContract;
    
    // Contract for the ERC20
    BurnableErc20 public destErc20;

    /// @param _destErc20 Destination token
    /// @param _kyberContract Kyber contract to use
    constructor(address _destErc20, address _kyberContract , address _uniswapContract) public {
        // Check inputs
        require(_destErc20 != address(0), "destination ERC20 should not be 0");
    //    require(_kyberContract != address(0), "kyber contract should not be 0");
        require(_uniswapContract != address(0) , "contract is not valid wrt uniswap");


        destErc20 = BurnableErc20(_destErc20);
      //  kyberContract = KyberNetwork(_kyberContract);
         uniObj = UniswapV2Router02(_destErc20);
    
    }
    
    /// @dev Fallback function to receive the ETH to burn later
    function() public payable { }

    /// @notice Main function. Trade the ETH for ERC20 and burn them.
    /// @param _maxSrcAmount Maximum amount of ETH to convert. If set to 0, all ETH on the
    ///  contract will be burned
    /// @param _maxDestAmount A limit on the amount of converted ERC20 tokens. Default value is MAX_UINT
    /// @param _minConversionRate The minimal conversion rate. Default value is 1 (market rate)
    /// @return amount of dest ERC20 tokens burned
    function burn(uint _maxSrcAmount, uint _maxDestAmount, uint _minConversionRate)
        external
        returns(uint)
    {
        // ETH to convert on Kyber, by default the amount of ETH on the contract
        // If _maxSrcAmount is defined, ethToConvert = min(balance on contract, _maxSrcAmount)
        uint ethToConvert = address(this).balance;
        if (_maxSrcAmount != 0 && _maxSrcAmount < ethToConvert) {
            ethToConvert = _maxSrcAmount;
        }

        // Set maxDestAmount to MAX_UINT if not sent as parameter
        uint maxDestAmount = _maxDestAmount != 0 ? _maxDestAmount : 2**256 - 1;

        // Set minConversionRate to 1 if not sent as parameter
        // A value of 1 will execute the trade according to market price in the time of the transaction confirmation
        uint minConversionRate = _minConversionRate != 0 ? _minConversionRate : 1;



        // Convert the ETH to ERC20
        // erc20ToBurn is the amount of the ERC20 tokens converted by Kyber that will be burned
        uint erc20ToBurn = kyberContract.trade.value(ethToConvert)(
            // Source. From Kyber docs, this value denotes ETH
            ERC20(0x00eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee),
            
            // Source amount
            ethToConvert,

            // Destination. Downcast BurnableErc20 to ERC20
            ERC20(destErc20),
            
            // destAddress: this contract
            this,
            
            // maxDestAmount
            maxDestAmount,
            
            // minConversionRate 
            minConversionRate,
            
            // walletId
            0
        );

        // Burn the converted ERC20 tokens
        destErc20.burn(erc20ToBurn);

        return erc20ToBurn;
    }

    /**
    * @notice Sets the KyberNetwork contract address.
    */  
    function setKyberNetworkContract(address _kyberNetworkAddress) 
        external
        onlyOwner
    {
        kyberContract = KyberNetwork(_kyberNetworkAddress);
    }
    function setUniswapNetworkContract(address _uniswapNetworkAddress)
        external
        onlyOwner 

    {


    }





}
