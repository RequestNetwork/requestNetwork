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
 * @dev Note that fees have 4 decimals (instead of 3 in a previous version)
 *      batchRouter is the main function, but other batch payment functions are "public" in order to do
 *      gas optimization in some cases.
 */
contract BatchConversionPayments is BatchNoConversionPayments {
  using SafeERC20 for IERC20;

  IERC20ConversionProxy public paymentErc20ConversionProxy;
  IEthConversionProxy public paymentEthConversionProxy;

  uint256 public batchConversionFee;

  /**
   * @dev Used by the batchRouter to handle information for heterogeneous batches, grouped by payment network.
   *  - paymentNetworkId: from 0 to 4, cf. `batchRouter()` method.
   *  - conversionDetails all the data required for conversion requests to be paid, for paymentNetworkId = 0 or 4
   *  - cryptoDetails all the data required to pay requests without conversion, for paymentNetworkId = 1, 2, or 3
   */
  struct MetaDetail {
    uint256 paymentNetworkId;
    ConversionDetail[] conversionDetails;
    CryptoDetails cryptoDetails;
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
    batchConversionFee = 0;
  }

  /**
   * @notice Batch payments on different payment networks at once.
   * @param metaDetails contains paymentNetworkId, conversionDetails, and cryptoDetails
   * - batchMultiERC20ConversionPayments, paymentNetworkId=0
   * - batchERC20Payments, paymentNetworkId=1
   * - batchMultiERC20Payments, paymentNetworkId=2
   * - batchEthPayments, paymentNetworkId=3
   * - batchEthConversionPayments, paymentNetworkId=4
   * If metaDetails use paymentNetworkId = 4, it must be at the end of the list, or the transaction can be reverted
   * @param pathsToUSD The list of paths into USD for every token, used to limit the batch fees, caution,
                       Caution, the calculation of batchFeeAmountUSD which allows to limit the batch fees takes only 
                       into consideration these paths. Without paths, there is not limitation.
   * @param _feeAddress The address where fees should be paid
   * @dev batchRouter only reduces gas consumption when using more than a single payment network.
   *      For single payment network payments, it is more efficient to use the suited batch function.
   */
  function batchRouter(
    MetaDetail[] calldata metaDetails,
    address[][] calldata pathsToUSD,
    address _feeAddress
  ) external payable {
    require(metaDetails.length < 6, 'more than 5 metaDetails');
    uint256 batchFeeAmountUSD = 0;
    for (uint256 i = 0; i < metaDetails.length; i++) {
      MetaDetail calldata metaConversionDetail = metaDetails[i];
      if (metaConversionDetail.paymentNetworkId == 0) {
        batchFeeAmountUSD += batchMultiERC20ConversionPayments(
          metaConversionDetail.conversionDetails,
          batchFeeAmountUSD,
          pathsToUSD,
          _feeAddress
        );
      } else if (metaConversionDetail.paymentNetworkId == 1) {
        batchERC20Payments(
          metaConversionDetail.conversionDetails,
          pathsToUSD,
          batchFeeAmountUSD,
          _feeAddress
        );
      } else if (metaConversionDetail.paymentNetworkId == 2) {
        batchFeeAmountUSD += batchMultiERC20Payments(
          metaConversionDetail.conversionDetails,
          pathsToUSD,
          batchFeeAmountUSD,
          _feeAddress
        );
      } else if (metaConversionDetail.paymentNetworkId == 3) {
        if (metaDetails[metaDetails.length - 1].paymentNetworkId == 4) {
          // Set to false only if batchEthConversionPayments is called after this function
          transferBackRemainingEth = false;
        }
        batchEthPayments(
          metaConversionDetail.cryptoDetails.recipients,
          metaConversionDetail.cryptoDetails.amounts,
          metaConversionDetail.cryptoDetails.paymentReferences,
          metaConversionDetail.cryptoDetails.feeAmounts,
          payable(_feeAddress)
        );
        if (metaDetails[metaDetails.length - 1].paymentNetworkId == 4) {
          transferBackRemainingEth = true;
        }
      } else if (metaConversionDetail.paymentNetworkId == 4) {
        batchEthConversionPayments(metaConversionDetail.conversionDetails, payable(_feeAddress));
      } else {
        revert('wrong paymentNetworkId');
      }
    }
  }

  /**
   * @notice Send a batch of ERC20 payments with amounts based on a request
   * currency (e.g. fiat), with fees and paymentReferences to multiple accounts, with multiple tokens.
   * @param conversionDetails list of requestInfo, each one containing all the information of a request
   * @param batchFeeAmountUSD The batchFeeAmountUSD already paid
   * @param pathsToUSD The list of paths into USD for every token
   * @param _feeAddress The fee recipient
   */
  function batchMultiERC20ConversionPayments(
    ConversionDetail[] calldata conversionDetails,
    uint256 batchFeeAmountUSD,
    address[][] calldata pathsToUSD,
    address _feeAddress
  ) public returns (uint256) {
    Token[] memory uTokens = getUTokens(conversionDetails);

    IERC20 requestedToken;
    // For each token: check allowance, transfer funds on the contract and approve the paymentProxy to spend if needed
    for (uint256 k = 0; k < uTokens.length && uTokens[k].amountAndFee > 0; k++) {
      requestedToken = IERC20(uTokens[k].tokenAddress);
      uTokens[k].batchFeeAmount = (uTokens[k].amountAndFee * batchConversionFee) / tenThousand;
      // Check proxy's allowance from user, and user's funds to pay approximated amounts.
      require(
        requestedToken.allowance(msg.sender, address(this)) >= uTokens[k].amountAndFee,
        'Insufficient allowance for batch to pay'
      );
      require(
        requestedToken.balanceOf(msg.sender) >= uTokens[k].amountAndFee + uTokens[k].batchFeeAmount,
        'not enough funds, including fees'
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
        _feeAddress,
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

      uint256 batchFeeToPay = ((uTokens[k].amountAndFee - excessAmount) * batchConversionFee) /
        tenThousand;

      (batchFeeToPay, batchFeeAmountUSD) = calculateBatchFeeToPay(
        batchFeeToPay,
        uTokens[k].tokenAddress,
        batchFeeAmountUSD,
        pathsToUSD
      );

      // Payer pays the exact batch fees amount
      require(
        safeTransferFrom(uTokens[k].tokenAddress, _feeAddress, batchFeeToPay),
        'batch fee transferFrom() failed'
      );
    }
    return batchFeeAmountUSD;
  }

  /**
   * @notice Send a batch of ETH conversion payments with fees and paymentReferences to multiple accounts.
   *         If one payment fails, the whole batch is reverted.
   * @param conversionDetails List of requestInfos, each one containing all the information of a request.
   *                     _maxToSpend is not used in this function.
   * @param _feeAddress The fee recipient.
   * @dev It uses EthereumConversionProxy to pay an invoice and fees.
   *      Please:
   *        Note that if there is not enough ether attached to the function call,
   *        the following error is thrown: "revert paymentProxy transferExactEthWithReferenceAndFee failed"
   *        This choice reduces the gas significantly, by delegating the whole conversion to the payment proxy.
   */
  function batchEthConversionPayments(
    ConversionDetail[] calldata conversionDetails,
    address payable _feeAddress
  ) public payable {
    uint256 contractBalance = address(this).balance;
    payerAuthorized = true;

    // Batch contract pays the requests through EthConversionProxy
    for (uint256 i = 0; i < conversionDetails.length; i++) {
      paymentEthConversionProxy.transferWithReferenceAndFee{value: address(this).balance}(
        payable(conversionDetails[i].recipient),
        conversionDetails[i].requestAmount,
        conversionDetails[i].path,
        conversionDetails[i].paymentReference,
        conversionDetails[i].feeAmount,
        _feeAddress,
        conversionDetails[i].maxRateTimespan
      );
    }

    // Check that batch contract has enough funds to pay batch conversion fees
    uint256 amountBatchFees = (((contractBalance - address(this).balance)) * batchConversionFee) /
      tenThousand;
    require(address(this).balance >= amountBatchFees, 'not enough funds for batch conversion fees');

    // Batch contract pays batch fee
    _feeAddress.transfer(amountBatchFees);

    // Batch contract transfers the remaining ethers to the payer
    (bool sendBackSuccess, ) = payable(msg.sender).call{value: address(this).balance}('');
    require(sendBackSuccess, 'Could not send remaining funds to the payer');
    payerAuthorized = false;
  }

  /*
   * Admin functions to edit the conversion proxies address and fees
   */

  /**
   * @notice fees added when using Erc20/Eth conversion batch functions
   * @param _batchConversionFee between 0 and 10000, i.e: batchFee = 50 represent 0.50% of fees
   */
  function setBatchConversionFee(uint256 _batchConversionFee) external onlyOwner {
    batchConversionFee = _batchConversionFee;
  }

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
   * @notice Update the conversion path contract used to fetch conversions
   * @param _chainlinkConversionPathAddress address of the conversion path contract
   */
  function setConversionPathAddress(address _chainlinkConversionPathAddress) external onlyOwner {
    chainlinkConversionPath = ChainlinkConversionPath(_chainlinkConversionPathAddress);
  }
}
