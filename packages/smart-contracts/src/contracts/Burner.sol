pragma solidity >0.4.18;

import "./Destructible.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "./UniswapRouting.sol";
import "RequestOpenHashSubmitter.sol"
import "@openzeppelin-contracts/contracts/access/Ownable.sol"  
// for the execution of the burner contracts . 
const HoneySwapRoutingContracts = ' 0x1C232F01118CB8B424793ae03F870aa7D0ac7f77';

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


/// @title Interface for UniswapRouter for the s
interface IUniswapV2Router02 {
  function swapTokensForExactTokens(
    uint amountOut,
    uint amountInMax,
    address[] calldata path,
    address to,
    uint deadline
  ) external returns (uint[] memory amounts);
}



/// @title Burner
/// @notice A contract to burn ERC20 tokens from ETH. Sends the ETH on the contract to Uniswap for conversion to ERC20.
///  The converted ERC20 is then burned.
/// @author Request Network
contract Burner is Destructible  {

    private reqTokenAddress = '0x8f8221afbb33998d8584a2b05749ba73c37a938a';
    private  StakeContractAddress = '0xb7D311E2Eb55F2f68a9440da38e7989210b9A05e';

    UniswapRouting  public UniswapContract;  
    // Contract for the ERC20
    BurnableErc20 public destErc20;

    /// @param _destErc20 Destination token
    /// @param _kyberContract Kyber contract to use
    constructor(address _destErc20,address _HoneyContract) public {
        // Check inputs
        require(_destErc20 != address(0), "destination ERC20 should not be 0");
    //    require(_kyberContract != address(0), "kyber contract should not be 0");
        require(_HoneyContract != address(0) , "contract is not valid wrt HoneySwap");


        destErc20 = BurnableErc20(_destErc20);
      //  kyberContract = KyberNetwork(_kyberContract);
        // honeyswapRouter router contract : 0x1C232F01118CB8B424793ae03F870aa7D0ac7f77
        // honeyswapRouter factory contract : 0xA818b4F111Ccac7AA31D0BCc0806d64F2E0737D7
         honeySwapContract = Uni(_factoryContract , _WETH);
    
    }
    
    /// @dev Fallback function to receive the ETH to burn later
    function() public payable { }


    ///@dev  there needs to be liquidity pool needed for the exchange , thus fist create the liquidity provider  of REQ-HNY.   . 



    /// @notice Main function. Trade the ETH for ERC20 and burn them.
    /// @param _maxSrcAmount Maximum amount of ETH to convert. If set to 0, all ETH on the
    ///  contract will be burned
    /// @param _maxDestAmount A limit on the amount of converted ERC20 tokens. Default value is MAX_UINT
    /// @param _minConversionRate The minimal conversion rate. Default value is 1 (market rate)
    /// @return amount of dest ERC20 tokens burned


   /** here we need to insure the burn contract to transfer the ownership  , along with the 
   
    */
    function burn(uint _maxSrcAmount, uint _maxDestAmount, uint _minConversionRate , uint _timeCounter)
        external
        returns(uint)
    {
        // ETH to convert on Kyber, by default the amount of ETH on the contract
        // If _maxSrcAmount is defined, ethToConvert = min(balance on contract, _maxSrcAmount)
//        uint ethToConvert = address(this).balance;
        uint STAKEtoConvert = address(this).balance;




        if (_maxSrcAmount != 0 && _maxSrcAmount < ethToConvert) {
            ethToConvert = _maxSrcAmount;
        }

        // Set maxDestAmount to MAX_UINT if not sent as parameter
        uint maxDestAmount = _maxDestAmount != 0 ? _maxDestAmount : 2**256 - 1;

        // Set minConversionRate to 1 if not sent as parameter
        // A value of 1 will execute the trade according to market price in the time of the transaction confirmation
        uint minConversionRate = _minConversionRate != 0 ? _minConversionRate : 1;

        
        uint erc20ToBurn = UniswapRouting.swapTokensForExactTokens(
            //amountOut : corresponds to the maximum  amount that  client will be adding 
            maxDestAmount,
            // surely should be  less than the holding of the 
            MAX_UINT,
            [reqTokenAddress , StakeContractAddress ],
            ERC20(destErc20),
            //deadline , can be within 5 sec , to avoid the higher slippage instances 
            5
        )

        )


        // Convert the ETH to ERC20
        // erc20ToBurn is the amount of the ERC20 tokens converted by Kyber that will be burned
        /**uint erc20ToBurn = kyberContract.trade.value(ethToConvert)(
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

        return erc20ToBurn;  */
    }

    /**
    * @notice Sets the KyberNetwork contract address.
      
    function setKyberNetworkContract(address _kyberNetworkAddress) 
        external
        onlyOwner
    {
        kyberContract = KyberNetwork(_kyberNetworkAddress);
    }

    */
    
    function setUniswapContract(address _uniswapNetworkAddress)
        external
        onlyOwner 

    { UniswapContract = UniswapV2Router02(_uniswapNetworkAddress);


    }





}
