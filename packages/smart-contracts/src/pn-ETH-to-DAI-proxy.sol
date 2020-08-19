/**
* This is a POC.
* 
* How to use:
* 1/ Use this contract to know how much ETH you should use for a certain amount of DAI:
*     - Contract: https://kovan.etherscan.io/address/0x56565942DD4445c8A2797F9DA14f2000B85D95f0#code
*     - For example, for 0.01 DAI: getEstimatedETHforDAI(10000000000000000)
* 
* 2/ In this contract, cal the function 
*     - Function transferDAIFromETHWithReference(0x61076Da38517be36d433E3fF8D6875B87880Ba56, 10000000000000000, 0xabcdef)
*     - with the amount of ETH given by step 1 as amount
*
* 3/ Event received: https://kovan.etherscan.io/address/0xe2846023d0a2c5dfc68f68d61007b91fc8c91df5#events
*/

pragma solidity ^0.6.2;

import "https://github.com/Uniswap/uniswap-v2-periphery/blob/master/contracts/interfaces/IUniswapV2Router02.sol";

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


/**
 * @title ERC20Proxy
 * @notice This contract performs an ERC20 token transfer and stores a reference
  */
contract ERC20ProxyFromETH {
  // Event to declare a transfer with a reference
  event TransferWithReference(
    address tokenAddress,
    address to,
    uint256 amount,
    bytes indexed paymentReference
  );


  address internal constant UNISWAP_ROUTER_ADDRESS = 0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D ;

  IUniswapV2Router02 public uniswapRouter;
  address private multiDaiKovan = 0x4F96Fe3b7A6Cf9725f59d353F723c1bDb64CA6Aa;

  constructor() public {
    uniswapRouter = IUniswapV2Router02(UNISWAP_ROUTER_ADDRESS);
  }

  function convertEthToDai(uint daiAmount) public payable {
    uint deadline = now + 15; // using 'now' for convenience, for mainnet pass deadline from frontend!
    uniswapRouter.swapETHForExactTokens.value(msg.value)(daiAmount, getPathForETHtoDAI(), address(this), deadline);
    
    // refund leftover ETH to user
    msg.sender.call.value(address(this).balance)("");
  }
  
  
  function getPathForETHtoDAI() private view returns (address[] memory) {
    address[] memory path = new address[](2);
    path[0] = uniswapRouter.WETH();
    path[1] = multiDaiKovan;
    
    return path;
  }
  
  /**
  * @notice Performs a DAI token transfer from ETH with a reference
  * @param _to Transfer recipient
  * @param _amount Amount to transfer
  * @param _paymentReference Reference of the payment related
  */
  function transferDAIFromETHWithReference(
    //address _tokenAddress,
    address _to,
    uint256 _amount,
    bytes calldata _paymentReference
  )
    external 
    payable
  {
    IERC20 erc20 = IERC20(0x4F96Fe3b7A6Cf9725f59d353F723c1bDb64CA6Aa);
    convertEthToDai(_amount);
    require(erc20.transfer(_to, _amount), "transfer() failed");
    //require(erc20.transferFrom(msg.sender, _to, _amount), "transferFrom() failed");
    
    emit TransferWithReference(
      0x4F96Fe3b7A6Cf9725f59d353F723c1bDb64CA6Aa,
      _to,
      _amount,
      _paymentReference
    );
  }
  
  // important to receive ETH
  receive() payable external {}
}
