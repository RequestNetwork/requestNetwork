/**
 * x Deployed here: https://kovan.etherscan.io/address/0xe68cc10fd944b3deff3e2766856aac44f96f47e8
 * v Then: 0x5Cb058deC191492B4d98C98BabE204eF376b3998
*/

pragma solidity ^0.6.2;

import "./github/Uniswap/uniswap-v2-periphery/contracts/interfaces/IUniswapV2Router02.sol";

/**
 * @dev Interface of the ERC20 standard as defined in the EIP. Does not include
 * the optional functions; to access them see {ERC20Detailed}.
 */
interface IERC20 {
    /**
     * @dev Returns the amount of tokens in existence.
     */
    function totalSupply() external view returns (uint256);

    /**
     * @dev Returns the amount of tokens owned by `account`.
     */
    function balanceOf(address account) external view returns (uint256);

    /**
     * @dev Moves `amount` tokens from the caller's account to `recipient`.
     *
     * Returns a boolean value indicating whether the operation succeeded.
     *
     * Emits a {Transfer} event.
     */
    function transfer(address recipient, uint256 amount) external returns (bool);

    /**
     * @dev Returns the remaining number of tokens that `spender` will be
     * allowed to spend on behalf of `owner` through {transferFrom}. This is
     * zero by default.
     *
     * This value changes when {approve} or {transferFrom} are called.
     */
    function allowance(address owner, address spender) external view returns (uint256);

    /**
     * @dev Sets `amount` as the allowance of `spender` over the caller's tokens.
     *
     * Returns a boolean value indicating whether the operation succeeded.
     *
     * IMPORTANT: Beware that changing an allowance with this method brings the risk
     * that someone may use both the old and the new allowance by unfortunate
     * transaction ordering. One possible solution to mitigate this race
     * condition is to first reduce the spender's allowance to 0 and set the
     * desired value afterwards:
     * https://github.com/ethereum/EIPs/issues/20#issuecomment-263524729
     *
     * Emits an {Approval} event.
     */
    function approve(address spender, uint256 amount) external returns (bool);

    /**
     * @dev Moves `amount` tokens from `sender` to `recipient` using the
     * allowance mechanism. `amount` is then deducted from the caller's
     * allowance.
     *
     * Returns a boolean value indicating whether the operation succeeded.
     *
     * Emits a {Transfer} event.
     */
    function transferFrom(address sender, address recipient, uint256 amount) external returns (bool);

    /**
     * @dev Emitted when `value` tokens are moved from one account (`from`) to
     * another (`to`).
     *
     * Note that `value` may be zero.
     */
    event Transfer(address indexed from, address indexed to, uint256 value);

    /**
     * @dev Emitted when the allowance of a `spender` for an `owner` is set by
     * a call to {approve}. `value` is the new allowance.
     */
    event Approval(address indexed owner, address indexed spender, uint256 value);
}

interface IFeePaymentNetwork {
  // Event to declare a transfer with a reference
  event TransferWithReferenceAndFee(
    address tokenAddress,
    address to,
    uint256 amount,
    bytes indexed paymentReference,
    uint256 feeAmount,
    address feeAddress
  );

  function transferFromWithReferenceAndFee(
    address _tokenAddress,
    address _to,
    uint256 _amount,
    bytes calldata _paymentReference,
    uint256 _feeAmount,
    address _feeAddress
    ) external;
}

/**
 * User should approve DAI to be spent by this contract
 * dai.approve(0x5Cb058deC191492B4d98C98BabE204eF376b3998, 1000000000000000000)
 * > https://kovan.etherscan.io/tx/0xcb6796351024920efaaf17277bb2ee4c2dbc91cde77aaa23bbc252f9130c262e
 * 
 * This contract should allow the USDC to be spent by the payment network
 * approvePaymentProxyToSpend(0x198419c5c340e8De47ce4C0E4711A03664d42CB2)
 * > https://kovan.etherscan.io/tx/0x12708aa5cf7a3d4e3b52ca0ea52c9f5587e3e9155b47687c26297c5ab9676983
 * 
 * This contract should allow the DAI to be spent by the Uniswap router
 * approveRouterToSpend(0x4F96Fe3b7A6Cf9725f59d353F723c1bDb64CA6Aa)
 * > https://kovan.etherscan.io/tx/
 * 
 * EXEC
 * _to: 0xAa0c45D2877373ad1AB2aa5Eab15563301e9b7b3
 * _amount: 1000000000000
 * _feeAmount: 1000000000
 * _feeAddress: 0x8400b234e7B113686bD584af9b1041E5a233E754

/**
 * @title ERC20Proxy
 * @notice This contract performs an ERC20 token transfer and stores a reference
  */
contract ERC20ProxySwapWithFeesV4 {

  IUniswapV2Router02 public uniswapRouter;
  IFeePaymentNetwork public paymentProxy;
  
  address private multiDaiKovan = 0x4F96Fe3b7A6Cf9725f59d353F723c1bDb64CA6Aa;
  address private usdcKovan = 0x198419c5c340e8De47ce4C0E4711A03664d42CB2;

  //address internal constant UNISWAP_ROUTER_ADDRESS = 0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D ;
  constructor(address _uniswapRouterAddress, address _paymentProxyddress) public {
    uniswapRouter = IUniswapV2Router02(_uniswapRouterAddress);
    paymentProxy = IFeePaymentNetwork(_paymentProxyddress);
  }

  function approvePaymentProxyToSpend(address erc20Address) public {
    IERC20 erc20 = IERC20(erc20Address);
    uint256 max = 2**256 - 1;
    erc20.approve(address(paymentProxy), max);
  }
  
  function approveRouterToSpend(address erc20Address) public {
    IERC20 erc20 = IERC20(erc20Address);
    uint256 max = 2**256 - 1;
    erc20.approve(address(uniswapRouter), max);
  }
  
  /**
  * @notice Performs a DAI token transfer from ETH with a reference
  * @param _to Transfer recipient
  * @param _amount Amount to transfer
  * @param _paymentReference Reference of the payment related
  */
  function transferUsdcFromDaiWithReferenceAndFee(
    //address _tokenAddress,
    address _to,
    uint256 _amount, // USDC (requestedErc20)
    bytes calldata _paymentReference,
    uint256 _feeAmount,
    address _feeAddress
  )
    external 
    payable
  {
      
    IERC20 dai = IERC20(multiDaiKovan);
    IERC20 usdc = IERC20(usdcKovan);
    
    uint256 totalAmount = _amount + _feeAmount; // USDC (requestedErc20)
    uint256 amountInMax = totalAmount*2;
    //convertEthToDai(totalAmount);
    
    // CONVERSION
    uint deadline = now + 15;
    
    address[] memory path = new address[](2);
    path[0] = multiDaiKovan;
    path[1] = usdcKovan;
    
    // One example here: https://kovan.etherscan.io/tx/0x53b03a7ae5c3f1272ec267fc444b96b7e2cf7cd24f42ef92874b28007daf9807
    uniswapRouter.swapExactTokensForTokens(
        amountInMax,
        totalAmount,
        path,
        address(this),
        deadline
    );
    
    // Allow the router to spend all this contract's Dai
    //const pnAddress = 0xFb6819d605E1Fa377a932016274cC84c9A07322f;
    if (dai.allowance(address(this),address(uniswapRouter)) < amountInMax) {
        approveRouterToSpend(multiDaiKovan);
    }
    
    // Allow the payment network to spend all this contract's USDC (requestedErc20)
    //const pnAddress = 0xFb6819d605E1Fa377a932016274cC84c9A07322f;
    if (usdc.allowance(address(this),address(paymentProxy)) < totalAmount) {
        approvePaymentProxyToSpend(usdcKovan);
    }
    
    paymentProxy.transferFromWithReferenceAndFee(
        usdcKovan,
        _to,
        _amount,
        _paymentReference,
        _feeAmount,
        _feeAddress
    );
    
    // Give the change back
    usdc.transfer(msg.sender, usdc.balanceOf(address(this)));
  }
  
  // important to receive ETH
  receive() payable external {}
}