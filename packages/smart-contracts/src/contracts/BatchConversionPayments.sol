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
 *         batchRouter is the main function to batch all kinds of payments at once.
 *         If one transaction of the batch fails, all transactions are reverted.
 * @dev batchRouter is the main function, but other batch payment functions are "public" in order to do
 *      gas optimization in some cases.
 */
contract BatchConversionPayments is BatchNoConversionPayments {
  using SafeERC20 for IERC20;

  IERC20ConversionProxy public paymentErc20ConversionProxy;
  IEthConversionProxy public paymentEthConversionProxy;

  /**
   * @dev Used by the batchRouter to handle information for heterogeneous batches, grouped by payment network.
   *  - paymentNetworkId: from 0 to 4, cf. `batchRouter()` method.
   *  - conversionDetails all the data required for conversion and no conversion requests to be paid
   */
  struct MetaDetail {
    uint256 paymentNetworkId;
    ConversionDetail[] conversionDetails;
  }

  /**
   * @param _paymentErc20Proxy The ERC20 payment proxy address to use.
   * @param _paymentEthProxy The ETH payment proxy address to use.
   * @param _paymentErc20ConversionProxy The ERC20 Conversion payment proxy address to use.
   * @param _paymentEthConversionFeeProxy The ETH Conversion payment proxy address to use.
   * @param _chainlinkConversionPathAddress The address of the conversion path contract
   * @param _owner Owner of the contract.
   */
  constructor(
    address _paymentErc20Proxy,
    address _paymentEthProxy,
    address _paymentErc20ConversionProxy,
    address _paymentEthConversionFeeProxy,
    address _chainlinkConversionPathAddress,
    address _owner
  )
    BatchNoConversionPayments(
      _paymentErc20Proxy,
      _paymentEthProxy,
      _chainlinkConversionPathAddress,
      _owner
    )
  {
    paymentErc20ConversionProxy = IERC20ConversionProxy(_paymentErc20ConversionProxy);
    paymentEthConversionProxy = IEthConversionProxy(_paymentEthConversionFeeProxy);
  }

  /**
   * @notice Batch payments on different payment networks at once.
   * @param metaDetails contains paymentNetworkId and conversionDetails
   * - batchMultiERC20ConversionPayments, paymentNetworkId=0
   * - batchERC20Payments, paymentNetworkId=1
   * - batchMultiERC20Payments, paymentNetworkId=2
   * - batchEthPayments, paymentNetworkId=3
   * - batchEthConversionPayments, paymentNetworkId=4
   * If metaDetails use paymentNetworkId = 4, it must be at the end of the list, or the transaction can be reverted.
   * @param pathsToUSD The list of paths into USD for every token, used to limit the batch fees.
   *                   Without paths, there is not limitation.
   * @param feeAddress The address where fees should be paid
   * @dev batchRouter only reduces gas consumption when using more than a single payment network.
   *      For single payment network payments, it is more efficient to use the suited batch function.
   */
  function batchRouter(
    MetaDetail[] calldata metaDetails,
    address[][] calldata pathsToUSD,
    address feeAddress
  ) external payable {
    require(metaDetails.length < 6, 'more than 5 metaDetails');
    if (pathsToUSD.length > 0) {
      // Set to true to limit the batch fee to pay
      batchPaymentOrigin = true;
    }
    uint256 batchFeeAmountUSD = 0;
    for (uint256 i = 0; i < metaDetails.length; i++) {
      MetaDetail calldata metaConversionDetail = metaDetails[i];
      if (metaConversionDetail.paymentNetworkId == 0) {
        batchFeeAmountUSD += batchMultiERC20ConversionPayments(
          metaConversionDetail.conversionDetails,
          batchFeeAmountUSD,
          pathsToUSD,
          feeAddress
        );
      } else if (metaConversionDetail.paymentNetworkId == 1) {
        batchFeeAmountUSD += batchERC20Payments(
          metaConversionDetail.conversionDetails,
          pathsToUSD,
          batchFeeAmountUSD,
          feeAddress
        );
      } else if (metaConversionDetail.paymentNetworkId == 2) {
        batchFeeAmountUSD += batchMultiERC20Payments(
          metaConversionDetail.conversionDetails,
          pathsToUSD,
          batchFeeAmountUSD,
          feeAddress
        );
      } else if (metaConversionDetail.paymentNetworkId == 3) {
        if (metaDetails[metaDetails.length - 1].paymentNetworkId == 4) {
          // Set to false only if batchEthConversionPayments is called after this function
          transferBackRemainingEth = false;
        }
        batchFeeAmountUSD += batchEthPayments(
          metaConversionDetail.conversionDetails,
          batchFeeAmountUSD,
          payable(feeAddress)
        );
        if (metaDetails[metaDetails.length - 1].paymentNetworkId == 4) {
          transferBackRemainingEth = true;
        }
      } else if (metaConversionDetail.paymentNetworkId == 4) {
        batchFeeAmountUSD += batchEthConversionPayments(
          metaConversionDetail.conversionDetails,
          batchFeeAmountUSD,
          payable(feeAddress)
        );
      } else {
        revert('Wrong paymentNetworkId');
      }
    }
    if (pathsToUSD.length > 0) {
      batchPaymentOrigin = false;
    }
  }

  /**
   * @notice Send a batch of ERC20 payments with amounts based on a request
   * currency (e.g. fiat), with fees and paymentReferences to multiple accounts, with multiple tokens.
   * @param conversionDetails List of ERC20 requests denominated in fiat to pay.
   * @param batchFeeAmountUSD The batch fee amount in USD already paid.
   * @param pathsToUSD The list of paths into USD for every token, used to limit the batch fees.
   *                   Without paths, there is not limitation.
   * @param feeAddress The fee recipient
   */
  function batchMultiERC20ConversionPayments(
    ConversionDetail[] calldata conversionDetails,
    uint256 batchFeeAmountUSD,
    address[][] calldata pathsToUSD,
    address feeAddress
  ) public returns (uint256) {
    // Avoid the possibility to manually put high value to batchFeeAmountUSD
    if (batchPaymentOrigin != true) {
      batchFeeAmountUSD = 0;
    }
    Token[] memory uTokens = getUTokens(conversionDetails);

    IERC20 requestedToken;
    // For each token: check allowance, transfer funds on the contract and approve the paymentProxy to spend if needed
    for (uint256 k = 0; k < uTokens.length && uTokens[k].amountAndFee > 0; k++) {
      requestedToken = IERC20(uTokens[k].tokenAddress);
      uTokens[k].batchFeeAmount = (uTokens[k].amountAndFee * batchFee) / feeDenominator;
      // Check proxy's allowance from user, and user's funds to pay approximated amounts.
      require(
        requestedToken.allowance(msg.sender, address(this)) >= uTokens[k].amountAndFee,
        'Insufficient allowance for batch to pay'
      );
      require(
        requestedToken.balanceOf(msg.sender) >= uTokens[k].amountAndFee + uTokens[k].batchFeeAmount,
        'Not enough funds, including fees'
      );

      // Transfer the amount and fee required for the token on the batch conversion contract
      require(
        safeTransferFrom(uTokens[k].tokenAddress, address(this), uTokens[k].amountAndFee),
        'payment transferFrom() failed'
      );

      // Batch contract approves Erc20ConversionProxy to spend the token
      if (
        requestedToken.allowance(address(this), address(paymentErc20ConversionProxy)) <
        uTokens[k].amountAndFee
      ) {
        approvePaymentProxyToSpend(uTokens[k].tokenAddress, address(paymentErc20ConversionProxy));
      }
    }

    // Batch pays the requests using Erc20ConversionFeeProxy
    for (uint256 i = 0; i < conversionDetails.length; i++) {
      ConversionDetail memory rI = conversionDetails[i];
      paymentErc20ConversionProxy.transferFromWithReferenceAndFee(
        rI.recipient,
        rI.requestAmount,
        rI.path,
        rI.paymentReference,
        rI.feeAmount,
        feeAddress,
        rI.maxToSpend,
        rI.maxRateTimespan
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
   * @notice Send a batch of ETH conversion payments with fees and paymentReferences to multiple accounts.
   *         If one payment fails, the whole batch is reverted.
   * @param conversionDetails List of ETH requests denominated in fiat to pay.
   * @param batchFeeAmountUSD The batch fee amount in USD already paid.
   * @param feeAddress The fee recipient.
   * @dev It uses EthereumConversionProxy to pay an invoice and fees.
   *      Please:
   *        Note that if there is not enough ether attached to the function call,
   *        the following error is thrown: "revert paymentProxy transferExactEthWithReferenceAndFee failed"
   *        This choice reduces the gas significantly, by delegating the whole conversion to the payment proxy.
   */
  function batchEthConversionPayments(
    ConversionDetail[] calldata conversionDetails,
    uint256 batchFeeAmountUSD,
    address payable feeAddress
  ) public payable returns (uint256) {
    // Avoid the possibility to manually put high value to batchFeeAmountUSD
    if (batchPaymentOrigin != true) {
      batchFeeAmountUSD = 0;
    }
    uint256 contractBalance = address(this).balance;
    payerAuthorized = true;

    // Batch contract pays the requests through EthConversionProxy
    for (uint256 i = 0; i < conversionDetails.length; i++) {
      ConversionDetail memory cD = conversionDetails[i];
      paymentEthConversionProxy.transferWithReferenceAndFee{value: address(this).balance}(
        payable(cD.recipient),
        cD.requestAmount,
        cD.path,
        cD.paymentReference,
        cD.feeAmount,
        feeAddress,
        cD.maxRateTimespan
      );
    }

    // Batch contract pays batch fee
    uint256 batchFeeToPay = (((contractBalance - address(this).balance)) * batchFee) /
      feeDenominator;

    (batchFeeToPay, batchFeeAmountUSD) = calculateBatchFeeToPay(
      batchFeeToPay,
      pathsEthToUSD[0][0],
      batchFeeAmountUSD,
      pathsEthToUSD
    );
    require(address(this).balance >= batchFeeToPay, 'Not enough funds for batch conversion fees');
    feeAddress.transfer(batchFeeToPay);

    // Batch contract transfers the remaining ethers to the payer
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
   * @param _paymentEthConversionProxy The address of the Ethereum Conversion payment proxy to use.
   *        Update cautiously, the proxy has to match the invoice proxy.
   */
  function setPaymentEthConversionProxy(address _paymentEthConversionProxy) external onlyOwner {
    paymentEthConversionProxy = IEthConversionProxy(_paymentEthConversionProxy);
  }

  /**
   * @notice Update the conversion path contract used to fetch conversions.
   * @param _chainlinkConversionPathAddress The address of the conversion path contract.
   */
  function setConversionPathAddress(address _chainlinkConversionPathAddress) external onlyOwner {
    chainlinkConversionPath = ChainlinkConversionPath(_chainlinkConversionPathAddress);
  }
}
