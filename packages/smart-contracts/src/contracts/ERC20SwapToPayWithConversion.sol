pragma solidity ^0.5.12;

import "@openzeppelin/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/ownership/Ownable.sol";
import "./lib/SafeERC20.sol";
import "./Erc20ConversionProxy.sol";
import "./ChainlinkConversionPath.sol";


interface IUniswapV2Router02 {
  function swapTokensForExactTokens(
    uint amountOut,
    uint amountInMax,
    address[] calldata path,
    address to,
    uint deadline
  ) external returns (uint[] memory amounts);
}


/**
 * @title ERC20SwapToPay
 * @notice This contract swaps ERC20 tokens before paying a request thanks to a payment proxy
  */
contract ERC20SwapToPayWithConversion is Ownable {
  using SafeERC20 for IERC20;
  using SafeMath for uint256;

  IUniswapV2Router02 public swapRouter;
  Erc20ConversionProxy public paymentProxy;
  ChainlinkConversionPath public chainlinkConversionPath;

  constructor(address _swapRouterAddress, address _paymentProxyAddress) public {
    swapRouter = IUniswapV2Router02(_swapRouterAddress);
    paymentProxy = Erc20ConversionProxy(_paymentProxyAddress);
    chainlinkConversionPath = ChainlinkConversionPath(paymentProxy.chainlinkConversionPath());
  }

 /**
  * @notice Authorizes the proxy to spend a new request currency (ERC20).
  * @param _erc20Address Address of an ERC20 used as a request currency
  */
  function approvePaymentProxyToSpend(address _erc20Address) public {
    IERC20 erc20 = IERC20(_erc20Address);
    uint256 max = 2**256 - 1;
    erc20.safeApprove(address(paymentProxy), max);
  }

 /**
  * @notice Authorizes the swap router to spend a new payment currency (ERC20).
  * @param _erc20Address Address of an ERC20 used for payment
  */
  function approveRouterToSpend(address _erc20Address) public {
    IERC20 erc20 = IERC20(_erc20Address);
    uint256 max = 2**256 - 1;
    erc20.safeApprove(address(swapRouter), max);
  }

  /**
  * @notice TODO
  */
  function swapTransferWithReference(
    address _to,
    uint256 _requestAmount, // requestCurrency
    uint256 _amountInMax, // SpentToken
    address[] calldata _uniswapPath, // from paymentNetworkToken to spentToken on uniswap
    address[] calldata _chainlinkPath, // from requestCurrency to spentToken on chainlink
    bytes calldata _paymentReference,
    uint256 _requestFeeAmount, // requestCurrency
    address _feeAddress,    
    uint256 _uniswapDeadline,
    uint256 _chainlinkMaxRateTimespan
  )
    external
  {
    require(_uniswapPath[_uniswapPath.length-1] == _chainlinkPath[_chainlinkPath.length-1], "the requested token on uniswap must be the payment currency");

    // Get the amount to pay in paymentNetworkToken
    uint256 paymentNetworkTotalAmount = getConversion(_chainlinkPath, _requestAmount, _requestFeeAmount);

    require(IERC20(_uniswapPath[0]).safeTransferFrom(msg.sender, address(this), _amountInMax), "Could not transfer payment token from swapper-payer");

    // Allow the router to spend all this contract's spentToken
    if (IERC20(_uniswapPath[0]).allowance(address(this),address(swapRouter)) < _amountInMax) {
      approveRouterToSpend(_uniswapPath[0]);
    }

    swapRouter.swapTokensForExactTokens(
      paymentNetworkTotalAmount,
      _amountInMax,
      _uniswapPath,
      address(this),
      _uniswapDeadline
    );

    // Allow the payment network to spend all this contract's paymentNetworkToken
    if (IERC20(_uniswapPath[_uniswapPath.length-1]).allowance(address(this),address(paymentProxy)) < paymentNetworkTotalAmount) {
      approvePaymentProxyToSpend(_uniswapPath[_uniswapPath.length-1]);
    }

    // Pay the request and fees
    paymentProxy.transferFromWithReferenceAndFee(
      _to,
      _requestAmount,
      _chainlinkPath,
      _paymentReference,
      _requestFeeAmount,
      _feeAddress,
      paymentNetworkTotalAmount, // _maxToSpend
      _chainlinkMaxRateTimespan
    );

    // Give the change back to the payer, in both currencies (only spent token should remain)
    if (IERC20(_uniswapPath[0]).balanceOf(address(this)) > 0) {
      IERC20(_uniswapPath[0]).safeTransfer(msg.sender, IERC20(_uniswapPath[0]).balanceOf(address(this)));
    }
    if (IERC20(_uniswapPath[_uniswapPath.length-1]).balanceOf(address(this)) > 0) {
      IERC20(_uniswapPath[0]).safeTransfer(msg.sender, IERC20(_uniswapPath[0]).balanceOf(address(this)));
    }
  }

  /*
  * Admin functions to edit the admin, router address or proxy address
  */
  function setPaymentProxy(address _paymentProxyAddress) public onlyOwner {
    paymentProxy = Erc20ConversionProxy(_paymentProxyAddress);
    chainlinkConversionPath = ChainlinkConversionPath(paymentProxy.chainlinkConversionPath());
  }

  function setRouter(address _newSwapRouterAddress) public onlyOwner {
    swapRouter = IUniswapV2Router02(_newSwapRouterAddress);
  }

  /*
  * Internal functions to reduce the stack in swapTransferWithReference()
  */
  function getConversion(address[] memory _path, uint256 _requestAmount, uint256 _requestFeeAmount) view internal returns (uint256 conversion) {
    (conversion, ) = chainlinkConversionPath.getConversion(_requestAmount.add(_requestFeeAmount), _path);
  }
}
