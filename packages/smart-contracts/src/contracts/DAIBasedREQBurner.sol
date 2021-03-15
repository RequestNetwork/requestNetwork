pragma solidity ^0.5.17;
import './lib/Ownable.sol';
import './interface/IUniswapV2Router02.sol';

/**
 * @title Contract for  allowing  removal of global supply of locked mintable erc20 tokens by converted from DAI using uniswap v2 router contract
 * @author Request Network
 */

interface IERC20 {
    function balanceOf(address _owner) external view returns (uint256 balance);

    function approve(address _spender, uint256 _value) external returns (bool success);

    event Approval(address indexed _owner, address indexed _spender, uint256 _value);
}

/*interface*/
contract IBurnableErc20 is IERC20 {
    function burn(uint256 value) external;
}

/** @title DaiBasedREQBurner
 * @notice A contract to burn REQ tokens from DAI.
 * @dev All DAIs sent to this contract can only be exchanged for REQs that are then burnt, using Uniswap.
 */
contract DaiBasedREQBurner is Ownable {
    // example tokens taken from rinkleby
    //address constant CTBK_ADDRESS = 0x995d6A8C21F24be1Dd04E105DD0d83758343E258;     // Instead of DAI
    //address constant FAU_ADDRESS_FIX = 0xFab46E002BbF0b4509813474841E0716E6730136;  // (Burnable) Instead of REQ

    address constant DAI_ADDRESS = 0x6B175474E89094C44Da98b954EedeAC495271d0F;
    address constant REQ_ADDRESS = 0x8f8221aFbB33998d8584A2B05749bA73c37a938a;

    address constant LOCKED_TOKEN_ADDRESS = DAI_ADDRESS;
    address constant BURNABLE_TOKEN_ADDRESS = REQ_ADDRESS;
    // swap router used to convert LOCKED into BURNABLE tokens
    IUniswapV2Router02 public swapRouter;

    /**
     * @notice Constructor of the DAI based REQ burner
     * @param _swapRouterAddress address of the uniswap token router (which follow the same method signature ).
     */
    constructor(address _swapRouterAddress) public {
        require(_swapRouterAddress != address(0), 'The swap router address should not be 0');
        swapRouter = IUniswapV2Router02(_swapRouterAddress);
    }

    /// @dev gives the permission to uniswap to accept the swapping of the BURNABLE token
    function approveRouterToSpend() public {
        uint256 max = 2**256 - 1;
        IERC20 dai = IERC20(LOCKED_TOKEN_ADDRESS);
        dai.approve(address(swapRouter), max);
    }

    ///@dev the main function to be executed
    ///@param _minReqBurnt  REQ token needed to be burned.
    ///@param _deadline  maximum timestamp to accept the trade from the router
    function burn(uint256 _minReqBurnt, uint256 _deadline) external returns (uint256) {
        IERC20 dai = IERC20(LOCKED_TOKEN_ADDRESS);
        IBurnableErc20 req = IBurnableErc20(BURNABLE_TOKEN_ADDRESS);
        uint256 daiToConvert = dai.balanceOf(address(this));

        if (_deadline == 0) {
            _deadline = block.timestamp + 1000;
        }

        // 1 step swapping path (only works if there is a sufficient liquidity behind the router)
        address[] memory path = new address[](2);
        path[0] = LOCKED_TOKEN_ADDRESS;
        path[1] = BURNABLE_TOKEN_ADDRESS;

        // Do the swap and get the amount of REQ purchased
        uint256 reqToBurn =
            swapRouter.swapExactTokensForTokens(
                daiToConvert,
                _minReqBurnt,
                path,
                address(this),
                _deadline
            )[1];

        // Burn all the purchased REQ and return this amount
        req.burn(reqToBurn);
        return reqToBurn;
    }
}
