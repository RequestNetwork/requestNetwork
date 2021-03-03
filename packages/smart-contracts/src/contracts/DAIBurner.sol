//SPDX-License-Identifier :UNLICENSED
pragma solidity ^0.8.0;
import "https://github.com/Uniswap/uniswap-v2-periphery/blob/master/contracts/interfaces/IUniswapV2Router02.sol";
import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/contracts/token/ERC20/ERC20.sol";



library SafeERC20 {
  function safeTransfer(
    IERC20 token,
    address to,
    uint256 value
  )
    internal
  {
    require(token.transfer(to, value));
  }

  function safeTransferFrom(
    IERC20 token,
    address from,
    address to,
    uint256 value
  )
    internal
  {
    require(token.transferFrom(from, to, value));
  }

  function safeApprove(
    IERC20 token,
    address spender,
    uint256 value
  )
    internal
  {
    require(token.approve(spender, value));
  }
}


// ownable contract. 
contract Ownable {
  address public owner;
  event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);
   /**
   * @dev The Ownable constructor sets the original `owner` of the contract to the sender
   * account.
   */
  constructor() public {
    owner = msg.sender;
  }


  /**
   * @dev Throws if called by any account other than the owner.
   */
  modifier onlyOwner() {
    require(msg.sender == owner);
    _;
  }


  /**
   * @dev Allows the current owner to transfer control of the contract to a newOwner.
   * @param newOwner The address to transfer ownership to.
   */
  function transferOwnership(address newOwner) onlyOwner public {
    require(newOwner != address(0));
    OwnershipTransferred(owner, newOwner);
    owner = newOwner;
  }

}

// ref : https://docs.soliditylang.org/en/v0.8.0/contracts.html
contract owned {
    constructor() { owner = payable(msg.sender); }
    address payable owner;

    // This contract only defines a modifier but does not use
    // it: it will be used in derived contracts.
    // The function body is inserted where the special symbol
    // `_;` in the definition of a modifier appears.
    // This means that if the owner calls this function, the
    // function is executed and otherwise, an exception is
    // thrown.
    modifier onlyOwner {
        require(
            msg.sender == owner,
            "Only owner can call this function."
        );
        _;
    }
}

contract destructible is owned {
    // This contract inherits the `onlyOwner` modifier from
    // `owned` and applies it to the `destroy` function, which
    // causes that calls to `destroy` only have an effect if
    // they are made by the stored owner.
    function destroy() public onlyOwner {
        selfdestruct(owner);
    }
}

/// @title Contract for a burnable ERC
abstract contract ERC20Burnable is Context, ERC20 {
    /**
     * @dev Destroys `amount` tokens from the caller.
     *
     * See {ERC20-_burn}.
     */
    function burn(uint256 amount) public virtual {
        _burn(_msgSender(), amount);
    }

    /**
     * @dev Destroys `amount` tokens from `account`, deducting from the caller's
     * allowance.
     *
     * See {ERC20-_burn} and {ERC20-allowance}.
     *
     * Requirements:
     *
     * - the caller must have allowance for ``accounts``'s tokens of at least
     * `amount`.
     */
    function burnFrom(address account, uint256 amount) public virtual {
        uint256 currentAllowance = allowance(account, _msgSender());
        require(currentAllowance >= amount, "ERC20: burn amount exceeds allowance");
        _approve(account, _msgSender(), currentAllowance - amount);
        _burn(account, amount);
    }
}


/// @title uniswap routing to burn DAI
contract UniswapRouting {
using SafeERC20 for ERC20;  
address public constant UNISWAP_ROUTER_ADDRESS = 0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D ;
    IUniswapV2Router02 public immutable router;
    constructor() public {
           router = IUniswapV2Router02(UNISWAP_ROUTER_ADDRESS);
    
        
    }





  modifier ensure(uint deadline) {
    require(deadline >= block.timestamp, "UniswapV2Router: EXPIRED");
    _;
  }

  // Will fail if amountInMax < 2 * amountOut
  function swapTokensForExactTokens(
    uint amountOut,
    uint amountInMax,
    address[] calldata path,
    address to,
    uint deadline
  ) external ensure(deadline) returns (uint[] memory amounts) 
  {
    amounts = new uint[](2);
    amounts[0] = amountOut;
    amounts[1] = amountOut * 2;
    require(amounts[1] <= amountInMax, "UniswapV2Router: EXCESSIVE_INPUT_AMOUNT");
    ERC20 paid = ERC20(path[0]);
    ERC20 swapped = ERC20(path[1]);
    require(swapped.balanceOf(address(this)) > amounts[0], "Test cannot proceed, lack of tokens in swap contract");
    paid.safeTransferFrom(msg.sender, address(this), amounts[1]);
    swapped.transfer(to, amounts[0]);
  }
   
    
}


/// @title Modified burner contract for transferring given REQ equivalent of DAI on the 0x00 address
/// @author Request Network
 contract Burner is destructible  , UniswapRouting {
    /// Uniswap contract that will be used for the conversion
    UniswapRouting public UniRouting;
    
    
  address  public   DAI_ROUTER_ADDRESS = 0x6B175474E89094C44Da98b954EedeAC495271d0F;
   address  public    REQ_ROUTER_ADDRESS = 0x8f8221aFbB33998d8584A2B05749bA73c37a938a;
   address public WETH = 0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2;
    // Contract for the ERC20
    ERC20Burnable public destErc20;

    /// @param _destErc20 Destination token
    /// @param _UniContract Uniswap Routing contract for swapping the REQ with DAI .
    constructor(address _destErc20, address _UniContract) public {
        // Check inputs
        require(_destErc20 != address(0), "needs to be REQ address");
        //require(UniRouting != address(0), "not correct Uniswap contract");

        destErc20 = ERC20Burnable(_destErc20);
        UniRouting = UniswapRouting(UniRouting);
        
    }
    
    /// @dev Fallback function to receive the ETH to burn later
   function () payable external Fallback ;
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
        
        uint MAX_UINT = 2**256 - 1;
        uint DAIToConvert = address(this).balance;
  //      address ZeroAdd = 0x00000000000000000;
        
        if (_maxSrcAmount != 0 && _maxSrcAmount < DAIToConvert) {
           DAIToConvert = _maxSrcAmount;
        }

        // Set maxDestAmount to MAX_UINT if not sent as parameter
        uint maxDestAmount = _maxDestAmount != 0 ? _maxDestAmount : 2**256 - 1;

        // Set minConversionRate to 1 if not sent as parameter
        // A value of 1 will execute the trade according to market price in the time of the transaction confirmation
        
        uint minConversionRate = _minConversionRate != 0 ? _minConversionRate : 1;

        // Convert the REQ to DAI
        // erc20ToBurn is the amount of the ERC20 tokens converted by UniswapRouting that will be burned
        //address for the uniswapV2 factory. 
        address factory = 0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f;
        
        uint256[] memory DAIToBurn;
        
         address token0 = REQ_ROUTER_ADDRESS ;
         address token1 = DAI_ROUTER_ADDRESS ;
        //address[3] calldata _pathTransfer = [REQ_ROUTER_ADDRESS , WETH    , DAI_ROUTER_ADDRESS ];
        //thanks to the documentation 
       
       
       address[] calldata _pathTransfer = address(uint(keccak256(abi.encodePacked(
               hex'ff',
               factory,
               keccak256(abi.encodePacked(token0, token1)),
     hex'96e8ac4277198ff8b6f785478aa9a39f403cb768dd02cbee326c3e7da348845f' // init code hash            
))));
        
        
        
        
        
         DAIToBurn = UniRouting.swapTokensForExactTokens(
            _maxDestAmount ,
            _maxSrcAmount,
            _pathTransfer,
            address(0),
            block.timestamp + 3600 
            
        
        
        
        
        );

        // Burn the converted DAI tokens
        DAIToBurn.burn(DAIToBurn);

        return DAIToBurn;
    }


    
}