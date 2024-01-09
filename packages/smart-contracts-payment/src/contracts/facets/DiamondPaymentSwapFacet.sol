// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import '@openzeppelin/contracts/token/ERC20/IERC20.sol';

import {LibPaymentConversion} from '../libraries/LibPaymentConversion.sol';
import {LibPayment} from '../libraries/LibPayment.sol';
import {LibDiamond} from '../libraries/LibDiamond.sol';
import {LibSwap} from '../libraries/LibSwap.sol';
import '../interfaces/ISwapRouter.sol';

/**
 * @title DiamondPaymentSwapFacet
 * @notice Facet of the Request Network protocol. Allow to perform swap payment with/without conversion
 */
contract DiamonPaymentSwapFacet {
  /**
   * @notice Performs a token swap between a payment currency and a request currency, and then
   *         calls a payment proxy to pay the request, including fees.
   * @param _to Transfer recipient = request issuer
   * @param _requestAmount Amount to transfer in request currency
   * @param _amountInMax Maximum amount allowed to spend for currency swap, in payment currency.
   *          This amount should take into account the fees.
   *  @param _path, path of ERC20 tokens to swap from requestedToken to spentToken. The first
   *          address of the path should be the payment currency. The last element should be the
   *          request currency.
   * @param _paymentReference Reference of the payment related
   * @param _feeAmount Amount of the fee in request currency
   * @param _feeAddress Where to pay the fee
   * @param _deadline Deadline for the swap to be valid
   */
  function tokenTransferWithSwap(
    address _to,
    uint256 _requestAmount, // In requestedToken
    uint256 _amountInMax, // In spentToken
    address[] calldata _path, // from requestedToken to spentToken
    bytes calldata _paymentReference,
    uint256 _feeAmount, // requestedToken
    address _feeAddress,
    uint256 _deadline
  ) external {
    uint256 requestedTotalAmount = _requestAmount + _feeAmount;

    require(
      LibPayment.safeTransferFrom(_path[0], address(this), _amountInMax),
      'tokenTransferWithSwap failed: safeTransferFrom() swapper-payer failed'
    );

    _approveAndSwap(requestedTotalAmount, _amountInMax, _path, _deadline);

    bool success = LibPayment.makeTokenPayment(
      _to,
      LibPaymentConversion.getPathLastElement(_path),
      _paymentReference,
      _requestAmount,
      _feeAddress,
      _feeAmount
    );

    require(success, 'tokenTransferWithSwap failed: makeTokenPayment() failed');
    LibSwap.transferRemainingTokensBack(_path);
  }

  /**
   * @notice Performs a request payment, denominated in a token or currency A,
   *         where the issuer expects a token B, and the payer uses a token C.
   *         The conversion rate from A to B is done using Chainlink.
   *         The token swap is done using UniswapV2 or equivalent.
   * @param _to Transfer recipient = request issuer
   * @param _requestAmount Amount to transfer in request currency
   * @param _amountInMax Maximum amount allowed to spend for currency swap, in payment network currency.
   *        This amount should take into account the fees.
   * @param _swapRouterPath, path of ERC20 tokens to swap from spentToken to expectedToken. The first
   *        address of the path should be the spent currency. The last element should be the
   *        expected currency.
   * @param _chainlinkPath, path of currencies to convert from invoicing currency to expectedToken. The first
   *        address of the path should be the invoicing currency. The last element should be the
   *        expected currency.
   * @param _paymentReference Reference of the payment related
   * @param _requestFeeAmount Amount of the fee in request currency
   * @param _feeAddress Where to pay the fee
   * @param _deadline Deadline for the swap to be valid
   * @param _chainlinkMaxRateTimespan Max time span with the oldestrate, ignored if zero
   */
  function tokenTransferWithSwapAndConversion(
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
      'tokenTransferWithSwapAndConversion failed: The requested swap token must be the payment currency'
    );
    require(_feeAddress != address(0), 'Invalid fee addres');

    // Get the amount to pay in paymentNetworkToken
    (uint256 expectedTokenAmount, uint256 expectedTokenFees) = LibPaymentConversion.getConversions(
      _chainlinkPath,
      _requestAmount,
      _requestFeeAmount,
      _chainlinkMaxRateTimespan
    );

    require(
      LibPayment.safeTransferFrom(_swapRouterPath[0], address(this), _amountInMax),
      'tokenTransferWithSwapAndConversion failed: safeTransferFrom() failed.'
    );

    _approveAndSwap(
      expectedTokenAmount + expectedTokenFees,
      _amountInMax,
      _swapRouterPath,
      _deadline
    );

    bool success = LibPayment.makeTokenPaymentWithConversion(
      _to,
      _requestAmount,
      _chainlinkPath,
      _paymentReference,
      _requestFeeAmount,
      _feeAddress,
      expectedTokenAmount + expectedTokenFees, // _maxToSpend
      _chainlinkMaxRateTimespan
    );
    require(
      success,
      'tokenTransferWithSwapAndConversion failed: tokenTransferWithConversion() failed'
    );

    LibSwap.transferRemainingTokensBack(_swapRouterPath);
  }

  /**
   * Internal function to reduce the stack size in the swap methods.
   * Approve the SwapRouter to spend the spentToken if needed
   * Swap the spentToken in exchange for the requestedToken
   */
  function _approveAndSwap(
    uint256 _expectedOutputAmount, // RequestedToken
    uint256 _maxInputAmount, // SpentToken
    address[] memory _swapRouterPath, // from spentToken to requestedToken on the swap router
    uint256 _deadline
  ) internal {
    IERC20 spentToken = IERC20(_swapRouterPath[0]);
    // Allow the router to spend all this contract's spentToken
    LibSwap.SwapStorage storage swapStorage = LibSwap.getStorage();
    if (spentToken.allowance(address(this), swapStorage.swapRouter) < _maxInputAmount) {
      uint256 max = 2**256 - 1;
      spentToken.approve(swapStorage.swapRouter, max);
    }
    ISwapRouter swapRouter = ISwapRouter(swapStorage.swapRouter);
    swapRouter.swapTokensForExactTokens(
      _expectedOutputAmount,
      _maxInputAmount,
      _swapRouterPath,
      address(this),
      _deadline
    );
  }

  /**
   * @notice Admin functions to edit the swap router address
   * @param _newSwapRouterAddress new swap router address
   */
  function setSwapRouter(address _newSwapRouterAddress) public {
    LibDiamond.enforceIsContractOwner();
    LibSwap.SwapStorage storage swapStorage = LibSwap.getStorage();
    swapStorage.swapRouter = _newSwapRouterAddress;
  }
}
