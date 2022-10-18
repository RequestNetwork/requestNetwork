// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import './interfaces/IERC20ConversionProxy.sol';
import './interfaces/IEthConversionProxy.sol';
import './BatchNoConversionPayments.sol';

/**
 * @title BatchConversionPayments
 * @notice This contract makes multiple conversion payments with references, in one transaction:
 *          - on:
 *              - ERC20 tokens: using Erc20ConversionProxy and ERC20FeeProxy
 *              - Native tokens: (e.g. ETH) using EthConversionProxy and EthereumFeeProxy
 *          - to: multiple addresses
 *          - fees: conversion proxy fees and additional batch conversion fees are paid to the same address.
 *         batchPayments is the main function to batch all kinds of payments at once.
 *         If one transaction of the batch fails, all transactions are reverted.
 * @dev batchPayments is the main function, but other batch payment functions are "public" in order to do
 *      gas optimization in some cases.
 */
contract BatchConversionPayments is BatchNoConversionPayments {
  using SafeERC20 for IERC20;

  IERC20ConversionProxy public paymentErc20ConversionProxy;
  IEthConversionProxy public paymentNativeConversionProxy;

  /** payerAuthorized is set to true to workaround the non-payable aspect in batch native conversion */
  bool private payerAuthorized = false;

  /**
   * @dev Used by the batchPayments to handle information for heterogeneous batches, grouped by payment network:
   *  - paymentNetworkId: from 0 to 4, cf. `batchPayments()` method
   *  - requestDetails all the data required for conversion and no conversion requests to be paid
   */
  struct MetaDetail {
    uint256 paymentNetworkId;
    RequestDetail[] requestDetails;
  }

  /**
   * @param _paymentErc20Proxy The ERC20 payment proxy address to use.
   * @param _paymentNativeProxy The native payment proxy address to use.
   * @param _paymentErc20ConversionProxy The ERC20 Conversion payment proxy address to use.
   * @param _paymentNativeConversionFeeProxy The native Conversion payment proxy address to use.
   * @param _chainlinkConversionPathAddress The address of the conversion path contract.
   * @param _owner Owner of the contract.
   */
  constructor(
    address _paymentErc20Proxy,
    address _paymentNativeProxy,
    address _paymentErc20ConversionProxy,
    address _paymentNativeConversionFeeProxy,
    address _chainlinkConversionPathAddress,
    address _owner
  )
    BatchNoConversionPayments(
      _paymentErc20Proxy,
      _paymentNativeProxy,
      _chainlinkConversionPathAddress,
      _owner
    )
  {
    paymentErc20ConversionProxy = IERC20ConversionProxy(_paymentErc20ConversionProxy);
    paymentNativeConversionProxy = IEthConversionProxy(_paymentNativeConversionFeeProxy);
  }

  /**
   * This contract is non-payable.
   * Making a Native payment with conversion requires the contract to accept incoming Native tokens.
   * @dev See the end of `paymentNativeConversionProxy.transferWithReferenceAndFee` where the leftover is given back.
   */
  receive() external payable override {
    require(payerAuthorized || msg.value == 0, 'Non-payable');
  }

  /**
   * @notice Batch payments on different payment networks at once.
   * @param metaDetails contains paymentNetworkId and requestDetails
   * - batchMultiERC20ConversionPayments, paymentNetworkId=0
   * - batchERC20Payments, paymentNetworkId=1
   * - batchMultiERC20Payments, paymentNetworkId=2
   * - batchNativePayments, paymentNetworkId=3
   * - batchNativeConversionPayments, paymentNetworkId=4
   * If metaDetails use paymentNetworkId = 4, it must be at the end of the list, or the transaction can be reverted.
   * @param pathsToUSD The list of paths into USD for every token, used to limit the batch fees.
   *                   For batch native, mock an array of array to apply the limit, e.g: [[]]
   *                   Without paths, there is not limitation, neither for the batch native functions.
   * @param feeAddress The address where fees should be paid.
   * @dev Use pathsToUSD only if you are pretty sure the batch fees will higher than the
   *      USD limit batchFeeAmountUSDLimit, because it increase gas consumption.
   *      batchPayments only reduces gas consumption when using more than a single payment network.
   *      For single payment network payments, it is more efficient to use the suited batch function.
   */
  function batchPayments(
    MetaDetail[] calldata metaDetails,
    address[][] calldata pathsToUSD,
    address feeAddress
  ) external payable {
    require(metaDetails.length < 6, 'more than 5 metaDetails');

    uint256 batchFeeAmountUSD = 0;
    for (uint256 i = 0; i < metaDetails.length; i++) {
      MetaDetail calldata metaDetail = metaDetails[i];
      if (metaDetail.paymentNetworkId == 0) {
        batchFeeAmountUSD += _batchMultiERC20ConversionPayments(
          metaDetail.requestDetails,
          batchFeeAmountUSD,
          pathsToUSD,
          feeAddress
        );
      } else if (metaDetail.paymentNetworkId == 1) {
        batchFeeAmountUSD += _batchERC20Payments(
          metaDetail.requestDetails,
          pathsToUSD,
          batchFeeAmountUSD,
          payable(feeAddress)
        );
      } else if (metaDetail.paymentNetworkId == 2) {
        batchFeeAmountUSD += _batchMultiERC20Payments(
          metaDetail.requestDetails,
          pathsToUSD,
          batchFeeAmountUSD,
          feeAddress
        );
      } else if (metaDetail.paymentNetworkId == 3) {
        if (metaDetails[metaDetails.length - 1].paymentNetworkId == 4) {
          // Set to false only if batchNativeConversionPayments is called after this function
          transferBackRemainingNativeTokens = false;
        }
        batchFeeAmountUSD += _batchNativePayments(
          metaDetail.requestDetails,
          pathsToUSD.length == 0,
          batchFeeAmountUSD,
          payable(feeAddress)
        );
        if (metaDetails[metaDetails.length - 1].paymentNetworkId == 4) {
          transferBackRemainingNativeTokens = true;
        }
      } else if (metaDetail.paymentNetworkId == 4) {
        batchFeeAmountUSD += _batchNativeConversionPayments(
          metaDetail.requestDetails,
          pathsToUSD.length == 0,
          batchFeeAmountUSD,
          payable(feeAddress)
        );
      } else {
        revert('Wrong paymentNetworkId');
      }
    }
  }

  /**
   * @notice Send a batch of ERC20 payments with amounts based on a request
   * currency (e.g. fiat), with fees and paymentReferences to multiple accounts, with multiple tokens.
   * @param requestDetails List of ERC20 requests denominated in fiat to pay.
   * @param pathsToUSD The list of paths into USD for every token, used to limit the batch fees.
   *                   Without paths, there is not a fee limitation, and it consumes less gas.
   * @param feeAddress The fee recipient.
   */
  function batchMultiERC20ConversionPayments(
    RequestDetail[] calldata requestDetails,
    address[][] calldata pathsToUSD,
    address feeAddress
  ) public returns (uint256) {
    return _batchMultiERC20ConversionPayments(requestDetails, 0, pathsToUSD, feeAddress);
  }

  /**
   * @notice Send a batch of Native conversion payments with fees and paymentReferences to multiple accounts.
   *         If one payment fails, the whole batch is reverted.
   * @param requestDetails List of native requests denominated in fiat to pay.
   * @param skipFeeUSDLimit Setting the value to true skips the USD fee limit, and reduce gas consumption.
   * @param feeAddress The fee recipient.
   * @dev It uses NativeConversionProxy (EthereumConversionProxy) to pay an invoice and fees.
   *      Please:
   *        Note that if there is not enough Native token attached to the function call,
   *        the following error is thrown: "revert paymentProxy transferExactEthWithReferenceAndFee failed"
   */
  function batchNativeConversionPayments(
    RequestDetail[] calldata requestDetails,
    bool skipFeeUSDLimit,
    address payable feeAddress
  ) public payable returns (uint256) {
    return _batchNativeConversionPayments(requestDetails, skipFeeUSDLimit, 0, feeAddress);
  }

  /**
   * @notice Send a batch of ERC20 payments with amounts based on a request
   * currency (e.g. fiat), with fees and paymentReferences to multiple accounts, with multiple tokens.
   * @param requestDetails List of ERC20 requests denominated in fiat to pay.
   * @param batchFeeAmountUSD The batch fee amount in USD already paid.
   * @param pathsToUSD The list of paths into USD for every token, used to limit the batch fees.
   *                   Without paths, there is not a fee limitation, and it consumes less gas.
   * @param feeAddress The fee recipient.
   */
  function _batchMultiERC20ConversionPayments(
    RequestDetail[] calldata requestDetails,
    uint256 batchFeeAmountUSD,
    address[][] calldata pathsToUSD,
    address feeAddress
  ) private returns (uint256) {
    Token[] memory uTokens = getUTokens(requestDetails);

    IERC20 requestedToken;
    // For each token: check allowance, transfer funds on the contract and approve the paymentProxy to spend if needed
    for (uint256 k = 0; k < uTokens.length && uTokens[k].amountAndFee > 0; k++) {
      uTokens[k].batchFeeAmount = (uTokens[k].amountAndFee * batchFee) / feeDenominator;
      requestedToken = IERC20(uTokens[k].tokenAddress);
      transferToContract(
        requestedToken,
        uTokens[k].amountAndFee,
        uTokens[k].batchFeeAmount,
        address(paymentErc20ConversionProxy)
      );
    }

    // Batch pays the requests using Erc20ConversionFeeProxy
    for (uint256 i = 0; i < requestDetails.length; i++) {
      RequestDetail calldata rD = requestDetails[i];
      paymentErc20ConversionProxy.transferFromWithReferenceAndFee(
        rD.recipient,
        rD.requestAmount,
        rD.path,
        rD.paymentReference,
        rD.feeAmount,
        feeAddress,
        rD.maxToSpend,
        rD.maxRateTimespan
      );
    }

    // Batch sends back to the payer the tokens not spent and pays the batch fee
    for (uint256 k = 0; k < uTokens.length && uTokens[k].amountAndFee > 0; k++) {
      requestedToken = IERC20(uTokens[k].tokenAddress);

      // Batch sends back to the payer the tokens not spent = excessAmount
      // excessAmount = maxToSpend - reallySpent, which is equal to the remaining tokens on the contract
      uint256 excessAmount = requestedToken.balanceOf(address(this));
      if (excessAmount > 0) {
        requestedToken.safeTransfer(msg.sender, excessAmount);
      }

      // Calculate batch fee to pay
      uint256 batchFeeToPay = ((uTokens[k].amountAndFee - excessAmount) * batchFee) /
        feeDenominator;

      (batchFeeToPay, batchFeeAmountUSD) = calculateBatchFeeToPay(
        batchFeeToPay,
        uTokens[k].tokenAddress,
        batchFeeAmountUSD,
        pathsToUSD
      );

      // Payer pays the exact batch fees amount
      require(
        safeTransferFrom(uTokens[k].tokenAddress, feeAddress, batchFeeToPay),
        'Batch fee transferFrom() failed'
      );
    }
    return batchFeeAmountUSD;
  }

  /**
   * @notice Send a batch of Native conversion payments with fees and paymentReferences to multiple accounts.
   *         If one payment fails, the whole batch is reverted.
   * @param requestDetails List of native requests denominated in fiat to pay.
   * @param skipFeeUSDLimit Setting the value to true skips the USD fee limit, and reduce gas consumption.
   * @param batchFeeAmountUSD The batch fee amount in USD already paid.
   * @param feeAddress The fee recipient.
   * @dev It uses NativeConversionProxy (EthereumConversionProxy) to pay an invoice and fees.
   *      Please:
   *        Note that if there is not enough Native token attached to the function call,
   *        the following error is thrown: "revert paymentProxy transferExactEthWithReferenceAndFee failed"
   */
  function _batchNativeConversionPayments(
    RequestDetail[] calldata requestDetails,
    bool skipFeeUSDLimit,
    uint256 batchFeeAmountUSD,
    address payable feeAddress
  ) private returns (uint256) {
    uint256 contractBalance = address(this).balance;
    payerAuthorized = true;

    // Batch contract pays the requests through nativeConversionProxy
    for (uint256 i = 0; i < requestDetails.length; i++) {
      RequestDetail calldata rD = requestDetails[i];
      paymentNativeConversionProxy.transferWithReferenceAndFee{value: address(this).balance}(
        payable(rD.recipient),
        rD.requestAmount,
        rD.path,
        rD.paymentReference,
        rD.feeAmount,
        feeAddress,
        rD.maxRateTimespan
      );
    }

    // Batch contract pays batch fee
    uint256 batchFeeToPay = (((contractBalance - address(this).balance)) * batchFee) /
      feeDenominator;

    if (skipFeeUSDLimit == false) {
      (batchFeeToPay, batchFeeAmountUSD) = calculateBatchFeeToPay(
        batchFeeToPay,
        pathsNativeToUSD[0][0],
        batchFeeAmountUSD,
        pathsNativeToUSD
      );
    }

    require(address(this).balance >= batchFeeToPay, 'Not enough funds for batch conversion fees');
    feeAddress.transfer(batchFeeToPay);

    // Batch contract transfers the remaining native tokens to the payer
    (bool sendBackSuccess, ) = payable(msg.sender).call{value: address(this).balance}('');
    require(sendBackSuccess, 'Could not send remaining funds to the payer');
    payerAuthorized = false;

    return batchFeeAmountUSD;
  }

  /*
   * Admin functions to edit the conversion proxies address and fees.
   */

  /**
   * @param _paymentErc20ConversionProxy The address of the ERC20 Conversion payment proxy to use.
   *        Update cautiously, the proxy has to match the invoice proxy.
   */
  function setPaymentErc20ConversionProxy(address _paymentErc20ConversionProxy) external onlyOwner {
    paymentErc20ConversionProxy = IERC20ConversionProxy(_paymentErc20ConversionProxy);
  }

  /**
   * @param _paymentNativeConversionProxy The address of the native Conversion payment proxy to use.
   *        Update cautiously, the proxy has to match the invoice proxy.
   */
  function setPaymentNativeConversionProxy(address _paymentNativeConversionProxy)
    external
    onlyOwner
  {
    paymentNativeConversionProxy = IEthConversionProxy(_paymentNativeConversionProxy);
  }
}
