pragma solidity ^0.5.17;
import "./lib/Ownable.sol";
import "./interface/IERC20.sol";
import "./interface/IUniswapV2Router02.sol";
/// @title Contract for  allowing exhaustion of  mintable erc20 tokens converted from DAI using uniswap v2 router contract 
/// @author Yoann , Request Network
/// @notice Currently used the contract only for experimental purposes and tokens only .
/// @dev some function calls have to be optimised (swapexactTokensforTokens for instance and further audit checks ).
///  pre-requisites are to mint tokens from faucet : http://central.request.network/


/*interface*/ contract IBurnableErc20 is IERC20 {
    function burn(uint value) external;
}
/// @title DAITestBurner
/// @notice A contract to burn test  ERC20 tokens from DAI.
/// @dev Sends the DAI to the uniswap router factory smart contract which then tries to mint the destination token using the specified token LP.
///  The converted ERC20 is then burned.
/// @param _swapRouterAddress address of the uniswap token router (which follow the same method signature ).
contract DaiBasedREQBurner is Ownable {
    // example tokens taken from rinkleby  which are burnable   
    address constant CTBK_ADDRESS = 0x995d6A8C21F24be1Dd04E105DD0d83758343E258;
    address constant FAU_ADDRESS = 0xFab46E002BbF0b4509813474841E0716E6730136;
   // defining the swap router project in order to approve the specific LP trading based on the given address.
    IUniswapV2Router02 public swapRouter;
    constructor(address _swapRouterAddress) public {
        require(_swapRouterAddress != address(0), "The swap router address should not be 0");
        // TODO:  generally this addresses needs to be whitelisted (for mainnet deployment ) 
        /// @dev can there be possiblity to attach an malicious LP providing contract
        
        swapRouter = IUniswapV2Router02(_swapRouterAddress);
    }
  /// @dev gives the permission to uniswap to accept the DAI token from the EOA to the given contract for swapping 
  /// and setting up the max limit to avoid the attacks .
  function approveRouterToSpend() public {
    uint256 max = 2**256 - 1;
    IERC20 dai = IERC20(CTBK_ADDRESS);
    dai.approve(address(swapRouter), max);
  }

  ///@dev 
  ///@param _minReqBurnt 
  ///@param _deadline 
    function burn(uint _minReqBurnt, uint256 _deadline)
        external
        returns(uint)
    {   // here we have defined the hardcoded version of the erc20 contracts.
        IERC20 dai = IERC20(CTBK_ADDRESS);
        IBurnableErc20 req = IBurnableErc20(FAU_ADDRESS);
        uint daiToConvert = dai.balanceOf(address(this));
        /// @dev  for uniswapV2Router.swapExactTokensForTokens , the parameter _deadline  insures that particular order to be completed in given time 
        if (_deadline == 0) {
            _deadline = block.timestamp + 1000;
        }
        address[] memory path = new address[](2);
        path[0] = CTBK_ADDRESS;
        path[1] = FAU_ADDRESS;
        /// @dev here we need to be specific that fixed amount of the tokens are to be locked for the burning to have transparency in the req conversion . 
        uint reqToBurn = swapRouter.swapExactTokensForTokens(
          daiToConvert,
          _minReqBurnt,
          path,
          address(this),
          _deadline
        )[1];
        // Burn the converted REQ tokens
        req.burn(reqToBurn);
        return reqToBurn;
    }
 
 ///@dev sets the router to specific version interface ( needs to be first step for utilising the interface contract)
  function setRouter(address _newSwapRouterAddress) public onlyOwner {
    swapRouter = IUniswapV2Router02(_newSwapRouterAddress);
  }
}