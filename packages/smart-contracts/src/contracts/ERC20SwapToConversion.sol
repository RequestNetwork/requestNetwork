// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import '@openzeppelin/contracts/token/ERC20/IERC20.sol';
import '@openzeppelin/contracts/access/Ownable.sol';
import './lib/SafeERC20.sol';
import './interfaces/IERC20ConversionProxy.sol';
import './ChainlinkConversionPath.sol';

interface ISwapRouter {
  function swapTokensForExactTokens(
    uint256 amountOut,
    uint256 amountInMax,
    address[] calldata path,
    address to,
    uint256 deadline
  ) external returns (uint256[] memory amounts);
}

/**
 * @title ERC20SwapToConversion
 * @notice This contract swaps ERC20 tokens before paying a request thanks to a payment proxy
 */
contract ERC20SwapToConversion is Ownable {
  using SafeERC20 for IERC20;

  ISwapRouter public swapRouter;
  ChainlinkConversionPath public chainlinkConversionPath;

  // Fees taken by request when a payment is made through swap. Range 0-1000. 10 => 1% fees.
  uint256 public requestSwapFees;

  constructor(address _owner) {
    _transferOwnership(_owner);
  }

  /**
* @notice Performs a request payment, denominated in a token or currency A,
*         where the issuer expects a token B, and the payer uses a token C.
*         The conversion rate from A to B is done using Chainlink.
*         The token swap is done using UniswapV2 or equivalent.
* @param _paymentProxy Address of the ERC20ConversionProxy which will perform the payment.
* @param _to Transfer recipient = request issuer
* @param _requestAmount Amount to transfer in request currency
* @param _amountInMax Maximum amount allowed to spend for currency swap, in payment network currency.
        This amount should take into account the fees.
@param _swapRouterPath, path of ERC20 tokens to swap from spentToken to expectedToken. The first
        address of the path should be the spent currency. The last element should be the
        expected currency.
@param _chainlinkPath, path of currencies to convert from invoicing currency to expectedToken. The first
        address of the path should be the invoicing currency. The last element should be the
        expected currency.
* @param _paymentReference Reference of the payment related
* @param _requestFeeAmount Amount of the fee in request currency
* @param _feeAddress Where to pay the fee
* @param _deadline Deadline for the swap to be valid
* @param _chainlinkMaxRateTimespan Max time span with the oldestrate, ignored if zero
*/
  function swapTransferWithReference(
    address _paymentProxy,
    address _to,
    uint256 _requestAmount, // requestCurrency
    uint256 _amountInMax, // SpentToken
    address[] memory _swapRouterPath, // from spentToken to expectedToken on the swap router
    address[] memory _chainlinkPath, // from invoicingCurrency to expectedToken on chainlink
    bytes memory _paymentReference,
    uint256 _requestFeeAmount, // requestCurrency
    address _feeAddress,
    uint256 _deadline,
    uint256 _chainlinkMaxRateTimespan
  ) external {
    require(
      _swapRouterPath[_swapRouterPath.length - 1] == _chainlinkPath[_chainlinkPath.length - 1],
      'the requested token on the swap router must be the payment currency'
    );
    require(_feeAddress != address(0), 'Invalid fee addres');

    // Get the amount to pay in paymentNetworkToken
    uint256 paymentNetworkTotalAmount = _getConversion(
      _chainlinkPath,
      _requestAmount,
      _requestFeeAmount
    );

    // Compute the request swap fees
    uint256 requestSwapFeesAmount = (paymentNetworkTotalAmount * requestSwapFees) / 1000;

    require(
      IERC20(_swapRouterPath[0]).safeTransferFrom(msg.sender, address(this), _amountInMax),
      'Could not transfer payment token from swapper-payer'
    );

    _swapAndApproveIfNeeded(
      _paymentProxy,
      _amountInMax,
      _swapRouterPath,
      _deadline,
      paymentNetworkTotalAmount + requestSwapFeesAmount
    );

    IERC20ConversionProxy paymentProxy = IERC20ConversionProxy(_paymentProxy);
    // Pay the request and fees
    try
      paymentProxy.transferFromWithReferenceAndFee(
        _to,
        _requestAmount,
        _chainlinkPath,
        _paymentReference,
        _requestFeeAmount,
        _feeAddress,
        paymentNetworkTotalAmount, // _maxToSpend
        _chainlinkMaxRateTimespan
      )
    {} catch (
      bytes memory /*lowLevelData*/
    ) {
      revert('Invalid payment proxy');
    }

    // Pay the request swap fees
    IERC20(_swapRouterPath[_swapRouterPath.length - 1]).safeTransfer(
      _feeAddress,
      requestSwapFeesAmount
    );

    // Give the change back to the payer, in both currencies (only spent token should remain)
    if (IERC20(_swapRouterPath[0]).balanceOf(address(this)) > 0) {
      IERC20(_swapRouterPath[0]).safeTransfer(
        msg.sender,
        IERC20(_swapRouterPath[0]).balanceOf(address(this))
      );
    }
    if (IERC20(_swapRouterPath[_swapRouterPath.length - 1]).balanceOf(address(this)) > 0) {
      IERC20(_swapRouterPath[_swapRouterPath.length - 1]).safeTransfer(
        msg.sender,
        IERC20(_swapRouterPath[_swapRouterPath.length - 1]).balanceOf(address(this))
      );
    }
  }

  /**
   * @notice Authorizes the proxy to spend a new request currency (ERC20).
   * @param _erc20Address Address of an ERC20 used as a request currency
   * @param _paymentProxy Address of the payment proxy to approve
   */
  function approvePaymentProxyToSpend(address _erc20Address, address _paymentProxy) public {
    IERC20 erc20 = IERC20(_erc20Address);
    uint256 max = 2**256 - 1;
    erc20.safeApprove(_paymentProxy, max);
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

  /*
   * Admin functions to edit the router address, the fees amount and the fees collector address
   */
  function setRouter(address _newSwapRouterAddress) public onlyOwner {
    swapRouter = ISwapRouter(_newSwapRouterAddress);
  }

  function updateRequestSwapFees(uint256 _newRequestSwapFees) public onlyOwner {
    requestSwapFees = _newRequestSwapFees;
  }

  function updateConversionPathAddress(address _chainlinkConversionPath) public onlyOwner {
    chainlinkConversionPath = ChainlinkConversionPath(_chainlinkConversionPath);
  }

  /*
   * Internal functions to reduce the stack in swapTransferWithReference()
   */
  function _getConversion(
    address[] memory _path,
    uint256 _requestAmount,
    uint256 _requestFeeAmount
  ) internal view returns (uint256 conversion) {
    (conversion, ) = chainlinkConversionPath.getConversion(
      _requestAmount + _requestFeeAmount,
      _path
    );
  }

  /**
   * Internal functions to reduce the stack in swapTransferWithReference()
   * Approve the SwapRouter to spend the spentToken if needed
   * Swap the spentToken in exchange for the expectedToken
   * Approve the payment proxy to spend the expected token if needed.
   */
  function _swapAndApproveIfNeeded(
    address _paymentProxy,
    uint256 _amountInMax, // SpentToken
    address[] memory _swapRouterPath, // from spentToken to expectedToken on the swap router
    uint256 _deadline,
    uint256 _paymentNetworkTotalAmount
  ) internal {
    IERC20 spentToken = IERC20(_swapRouterPath[0]);
    // Allow the router to spend all this contract's spentToken
    if (spentToken.allowance(address(this), address(swapRouter)) < _amountInMax) {
      approveRouterToSpend(address(spentToken));
    }

    swapRouter.swapTokensForExactTokens(
      _paymentNetworkTotalAmount,
      _amountInMax,
      _swapRouterPath,
      address(this),
      _deadline
    );

    IERC20 requestedToken = IERC20(_swapRouterPath[_swapRouterPath.length - 1]);

    // Allow the payment network to spend all this contract's requestedToken
    if (requestedToken.allowance(address(this), _paymentProxy) < _paymentNetworkTotalAmount) {
      approvePaymentProxyToSpend(address(requestedToken), _paymentProxy);
    }
  }
}
