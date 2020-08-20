/**
* This is a POC. Version 2 = relies on an existing payment network, with fees.
* 
* How to use:
* 0/ Preconditions:
*     - You can use this proxy with fees: https://kovan.etherscan.io/address/0xfb6819d605e1fa377a932016274cc84c9a07322f
*
* 1/ Use this contract to know how much ETH you should use for a certain amount of DAI:
*     - ! KEEP IN MIND: the amount should include fees
*     - Contract: https://kovan.etherscan.io/address/0x56565942DD4445c8A2797F9DA14f2000B85D95f0#code (unchanged)
*     - For example, for 0.01 DAI: getEstimatedETHforDAI(10000000000000000)
* 
* 2/ In this contract, call the function 
*     - Contract: https://kovan.etherscan.io/address/0xf333377decfa3ac960b73883b844b4b980a5c8f0
*     - Function: transferDAIFromETHWithReferenceAndFee(
                  // To
                    0xAa0c45D2877373ad1AB2aa5Eab15563301e9b7b3, 
                  // Amount
                    10000000000000000, 
                  // Payment ref
                    0x1988120520200820,
                  // Fee amount
                    10000000000000,
                  // Fee address
                    0x8400b234e7B113686bD584af9b1041E5a233E754
                  )
*     - with the amount of ETH given by step 1 as transaction value
*
* 3/ Event received:
*     - https://kovan.etherscan.io/address/0xfb6819d605e1fa377a932016274cc84c9a07322f#events
*
* 4/ Fees
*   When the contract needs to trigger approval 1st: (9 logs; 201,361)
*       https://kovan.etherscan.io/tx/0xcaad05c3b9f0c23b5b0c5b1f75ffa15ab158f7fb9b5c0d75396a860305fc8eed#eventlog
*   When the contract has already been approved: (8 logs; 160,989)
*       https://kovan.etherscan.io/tx/0x11e47c4d7a1f2f1ff3afb5cafaca4dd4a623bb8a2c262fb26437aa4f98040f22
*/

/**
 *Submitted for verification at Etherscan.io on 2019-12-17
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
 * @title ERC20Proxy
 * @notice This contract performs an ERC20 token transfer and stores a reference
  */
contract ERC20ProxyFromEthWithFeesV3 {

  IUniswapV2Router02 public uniswapRouter;
  IFeePaymentNetwork public paymentNetwork;
  
  address private multiDaiKovan = 0x4F96Fe3b7A6Cf9725f59d353F723c1bDb64CA6Aa;

  //address internal constant UNISWAP_ROUTER_ADDRESS = 0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D ;
  constructor(address _uniswapRouterAddress, address _paymentNetworkAddress) public {
    uniswapRouter = IUniswapV2Router02(_uniswapRouterAddress);
    paymentNetwork = IFeePaymentNetwork(_paymentNetworkAddress);
  }

  function convertEthToDai(uint daiAmount) public payable {
    // TODO: deadline as a dynamic parameter
    uint deadline = now + 15;
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
  
  function approvePaymentNetwork(address erc20Address) public {
    IERC20 erc20 = IERC20(erc20Address);
    uint256 max = 2**256 - 1;
    erc20.approve(address(paymentNetwork), max);
  }
  
  /**
  * @notice Performs a DAI token transfer from ETH with a reference
  * @param _to Transfer recipient
  * @param _amount Amount to transfer
  * @param _paymentReference Reference of the payment related
  */
  function transferDAIFromETHWithReferenceAndFee(
    //address _tokenAddress,
    address _to,
    uint256 _amount,
    bytes calldata _paymentReference,
    uint256 _feeAmount,
    address _feeAddress
  )
    external 
    payable
  {
      
    IERC20 erc20 = IERC20(multiDaiKovan);
    uint256 totalAmount = _amount + _feeAmount;
    convertEthToDai(totalAmount);
    
    // Allow the payment network to spend all this contract's ERC20
    //const pnAddress = 0xFb6819d605E1Fa377a932016274cC84c9A07322f;
    if (erc20.allowance(address(this),address(paymentNetwork)) < totalAmount) {
        approvePaymentNetwork(multiDaiKovan);
    }
    
    paymentNetwork.transferFromWithReferenceAndFee(
        multiDaiKovan,
        _to,
        _amount,
        _paymentReference,
        _feeAmount,
        _feeAddress
    );
  }
  
  // important to receive ETH
  receive() payable external {}
}