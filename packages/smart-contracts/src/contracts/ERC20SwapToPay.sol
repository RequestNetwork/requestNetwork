// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import '@openzeppelin/contracts/token/ERC20/IERC20.sol';
import '@openzeppelin/contracts/access/Ownable.sol';
import './lib/SafeERC20.sol';
import './interfaces/ERC20FeeProxy.sol';

interface IUniswapV2Router02 {
  function swapTokensForExactTokens(
    uint256 amountOut,
    uint256 amountInMax,
    address[] calldata path,
    address to,
    uint256 deadline
  ) external returns (uint256[] memory amounts);
}

/**
 * @title ERC20SwapToPay
 * @notice This contract swaps ERC20 tokens before paying a request thanks to a payment proxy
 */
contract ERC20SwapToPay is Ownable {
  using SafeERC20 for IERC20;

  IUniswapV2Router02 public swapRouter;

  // Fees taken by request when a payment is made through swap. Range 0-1000. 10 => 1% fees.
  uint256 public requestSwapFees;

  /**
   * @param _swapRouterAddress The address of the swap router.
   * @param _owner Owner of the contract.
   */
  constructor(address _swapRouterAddress, address _owner) {
    swapRouter = IUniswapV2Router02(_swapRouterAddress);
    _transferOwnership(_owner);
  }

  /**
   * @notice Authorizes the proxy to spend a new request currency (ERC20).
   * @param _erc20Address Address of an ERC20 used as a request currency
   * @param _paymentProxy Address of the payment proxy used
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

  /**
  * @notice Performs a token swap between a payment currency and a request currency, and then
  *         calls a payment proxy to pay the request, including fees.
  * @param _paymentProxy Address of the ERC20FeeProxy which will perform the payment.
  * @param _to Transfer recipient = request issuer
  * @param _amount Amount to transfer in request currency
  * @param _amountInMax Maximum amount allowed to spend for currency swap, in payment currency.
            This amount should take into account the fees.
    @param _path, path of ERC20 tokens to swap from requestedToken to spentToken. The first
            address of the path should be the payment currency. The last element should be the
            request currency.
  * @param _paymentReference Reference of the payment related
  * @param _feeAmount Amount of the fee in request currency
  * @param _feeAddress Where to pay the fee
  * @param _deadline Deadline for the swap to be valid
  */
  function swapTransferWithReference(
    address _paymentProxy,
    address _to,
    uint256 _amount, // requestedToken
    uint256 _amountInMax, // spentToken
    address[] calldata _path, // from requestedToken to spentToken
    bytes calldata _paymentReference,
    uint256 _feeAmount, // requestedToken
    address _feeAddress,
    uint256 _deadline
  ) external {
    IERC20 spentToken = IERC20(_path[0]);
    IERC20 requestedToken = IERC20(_path[_path.length - 1]);

    uint256 requestedTotalAmount = _amount + _feeAmount;

    // Compute the request swap fees
    uint256 requestSwapFeesAmount = (requestedTotalAmount * requestSwapFees) / 1000;

    require(
      spentToken.allowance(msg.sender, address(this)) >= _amountInMax,
      'Not sufficient allowance for swap to pay.'
    );
    require(
      spentToken.safeTransferFrom(msg.sender, address(this), _amountInMax),
      'Could not transfer payment token from swapper-payer'
    );

    // Allow the router to spend all this contract's spentToken
    if (spentToken.allowance(address(this), address(swapRouter)) < _amountInMax) {
      approveRouterToSpend(address(spentToken));
    }

    // Swap the spentToken against the requestedToken
    swapRouter.swapTokensForExactTokens(
      requestedTotalAmount + requestSwapFeesAmount,
      _amountInMax,
      _path,
      address(this),
      _deadline
    );

    approveAndPay(
      _paymentProxy,
      _to,
      _amount,
      _paymentReference,
      _feeAmount,
      _feeAddress,
      requestSwapFeesAmount,
      requestedToken
    );

    // Give the change back to the payer, in both currencies (only spent token should remain)
    if (spentToken.balanceOf(address(this)) > 0) {
      spentToken.safeTransfer(msg.sender, spentToken.balanceOf(address(this)));
    }
    if (requestedToken.balanceOf(address(this)) > 0) {
      requestedToken.safeTransfer(msg.sender, requestedToken.balanceOf(address(this)));
    }
  }

  /**
   * @notice Internal function called during a payment after the swap has been performed.
   *         Approve the proxy to spend this contract tokens, Calls the proxy to perform the actual payment,
   *         Pays the request swap fees
   * @param _paymentProxy Address of the ERC20FeeProxy which will perform the payment.
   * @param _to Transfer recipient = request issuer
   * @param _amount Amount to transfer in request currency
   * @param _paymentReference Reference of the payment related
   * @param _feeAmount Amount of the fee in request currency
   * @param _feeAddress Where to pay the fee
   * @param requestSwapFeesAmount Amount of the request swap fees
   * @param requestedToken The request currency
   */
  function approveAndPay(
    address _paymentProxy,
    address _to,
    uint256 _amount, // requestedToken
    bytes calldata _paymentReference,
    uint256 _feeAmount, // requestedToken
    address _feeAddress,
    uint256 requestSwapFeesAmount,
    IERC20 requestedToken
  ) internal {
    // Allow the payment network to spend all this contract's requestedToken
    if (requestedToken.allowance(address(this), _paymentProxy) < _amount + _feeAmount) {
      approvePaymentProxyToSpend(address(requestedToken), _paymentProxy);
    }

    IERC20FeeProxy paymentProxy = IERC20FeeProxy(_paymentProxy);

    // Pay the request and fees
    paymentProxy.transferFromWithReferenceAndFee(
      address(requestedToken),
      _to,
      _amount,
      _paymentReference,
      _feeAmount,
      _feeAddress
    );

    // Pay the request swap fees
    requestedToken.safeTransfer(_feeAddress, requestSwapFeesAmount);
  }

  /**
   * @notice Admin functions to edit the swap router address
   * @param _newSwapRouterAddress new swap router address
   */
  function setRouter(address _newSwapRouterAddress) public onlyOwner {
    swapRouter = IUniswapV2Router02(_newSwapRouterAddress);
  }

  /**
   * @notice Admin functions to edit the request swap fees
   * @param _newRequestSwapFees new request swap fees
   */
  function updateRequestSwapFees(uint256 _newRequestSwapFees) public onlyOwner {
    require(_newRequestSwapFees <= 50, "Request swap fees should not exceed 5%");
    requestSwapFees = _newRequestSwapFees;
  }
}
