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
