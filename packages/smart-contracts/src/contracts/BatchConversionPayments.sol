// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import './interfaces/IERC20ConversionProxy.sol';
import './interfaces/IEthConversionProxy.sol';
import './BatchPaymentsPublic.sol';

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
contract BatchConversionPayments is BatchPaymentsPublic {
  using SafeERC20 for IERC20;

  IERC20ConversionProxy paymentErc20ConversionProxy;
  IEthConversionProxy paymentEthConversionProxy;

  uint256 public batchConversionFee;

  /**
   * @dev All the information of a request, except the feeAddress
   *   _recipient Recipient address of the payment
   *   _requestAmount Request amount in fiat
   *   _path Conversion path
   *   _paymentReference Unique reference of the payment
   *   _feeAmount The fee amount denominated in the first currency of `_path`
   *   _maxToSpend Maximum amount the payer wants to spend, denominated in the last currency of `_path`:
   *               it includes fee proxy but NOT the batchConversionFee
   *   _maxRateTimespan Max acceptable times span for conversion rates, ignored if zero
   */
  struct ConversionDetail {
    address recipient;
    uint256 requestAmount;
    address[] path;
    bytes paymentReference;
    uint256 feeAmount;
    uint256 maxToSpend;
    uint256 maxRateTimespan;
  }

  /**
   * @dev BatchPaymentsPublic contract input structure.
   */
  struct CryptoDetails {
    address[] tokenAddresses;
    address[] recipients;
    uint256[] amounts;
    bytes[] paymentReferences;
    uint256[] feeAmounts;
  }

  /**
   * @dev Used by the batchRouter to handle information for heterogeneous batches, grouped by payment network.
   *  - paymentNetworkId: from 0 to 4, cf. `batchRouter()` method.
   *  - conversionDetails all the data required for conversion requests to be paid, for paymentNetworkId = 0 or 3
   *  - cryptoDetails all the data required to pay requests without conversion, for paymentNetworkId = 1, 2, or 4
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
   * @param _owner Owner of the contract.
   */
  constructor(
    address _paymentErc20Proxy,
    address _paymentEthProxy,
    address _paymentErc20ConversionProxy,
    address _paymentEthConversionFeeProxy,
    address _owner
  ) BatchPaymentsPublic(_paymentErc20Proxy, _paymentEthProxy, _owner) {
    paymentErc20Proxy = IERC20FeeProxy(_paymentErc20Proxy);
    paymentEthProxy = IEthereumFeeProxy(_paymentEthProxy);

    paymentErc20ConversionProxy = IERC20ConversionProxy(_paymentErc20ConversionProxy);
    paymentEthConversionProxy = IEthConversionProxy(_paymentEthConversionFeeProxy);
    transferOwnership(_owner);

    batchFee = 0;
    batchConversionFee = 0;
  }

  /**
   * @notice Batch payments on different payment networks at once.
   * @param metaDetails contains paymentNetworkId and conversionDetails
   * - batchERC20ConversionPaymentsMultiTokens, paymentNetworkId=0
   * - batchERC20PaymentsWithReference, paymentNetworkId=1
   * - batchERC20PaymentsMultiTokensWithReference, paymentNetworkId=2
   * - batchEthConversionPaymentsWithReference, paymentNetworkId=3
   * - batchEthPaymentsWithReference, paymentNetworkId=4
   * @param _feeAddress The address where fees should be paid
   * @dev batchRouter only reduces gas consumption when using more than a single payment network.
   *      For single payment network payments, it is more efficient to use the suited batch function.
   */
  function batchRouter(MetaDetail[] calldata metaDetails, address _feeAddress) external payable {
    require(metaDetails.length < 4, 'more than 4 conversionDetails');
    for (uint256 i = 0; i < metaDetails.length; i++) {
      MetaDetail calldata metaConversionDetail = metaDetails[i];
      if (metaConversionDetail.paymentNetworkId == 0) {
        batchERC20ConversionPaymentsMultiTokens(
          metaConversionDetail.conversionDetails,
          _feeAddress
        );
      } else if (metaConversionDetail.paymentNetworkId == 1) {
        batchERC20PaymentsWithReference(
          metaConversionDetail.cryptoDetails.tokenAddresses[0],
          metaConversionDetail.cryptoDetails.recipients,
          metaConversionDetail.cryptoDetails.amounts,
          metaConversionDetail.cryptoDetails.paymentReferences,
          metaConversionDetail.cryptoDetails.feeAmounts,
          _feeAddress
        );
      } else if (metaConversionDetail.paymentNetworkId == 2) {
        batchERC20PaymentsMultiTokensWithReference(
          metaConversionDetail.cryptoDetails.tokenAddresses,
          metaConversionDetail.cryptoDetails.recipients,
          metaConversionDetail.cryptoDetails.amounts,
          metaConversionDetail.cryptoDetails.paymentReferences,
          metaConversionDetail.cryptoDetails.feeAmounts,
          _feeAddress
        );
      } else if (metaConversionDetail.paymentNetworkId == 3) {
        batchEthConversionPaymentsWithReference(
          metaConversionDetail.conversionDetails,
          payable(_feeAddress)
        );
      } else if (metaConversionDetail.paymentNetworkId == 4) {
        batchEthPaymentsWithReference(
          metaConversionDetail.cryptoDetails.recipients,
          metaConversionDetail.cryptoDetails.amounts,
          metaConversionDetail.cryptoDetails.paymentReferences,
          metaConversionDetail.cryptoDetails.feeAmounts,
          payable(_feeAddress)
        );
      } else {
        revert('wrong paymentNetworkId');
      }
    }
  }

  /**
   * @notice Makes a batch of transfers for multiple ERC20 tokens, with amounts based on a request
   * currency (e.g. fiat) and with a reference per payment.
   * @param conversionDetails list of requestInfo, each one containing all the information of a request
   * @param _feeAddress The fee recipient
   */
  function batchERC20ConversionPaymentsMultiTokens(
    ConversionDetail[] calldata conversionDetails,
    address _feeAddress
  ) public {
    // a list of unique tokens, with the sum of maxToSpend by token
    Token[] memory uTokens = new Token[](conversionDetails.length);
    for (uint256 i = 0; i < conversionDetails.length; i++) {
      for (uint256 k = 0; k < conversionDetails.length; k++) {
        // If the token is already in the existing uTokens list
        if (
          uTokens[k].tokenAddress == conversionDetails[i].path[conversionDetails[i].path.length - 1]
        ) {
          uTokens[k].amountAndFee += conversionDetails[i].maxToSpend;
          break;
        }
        // If the token is not in the list (amountAndFee = 0)
        else if (uTokens[k].amountAndFee == 0 && (conversionDetails[i].maxToSpend) > 0) {
          uTokens[k].tokenAddress = conversionDetails[i].path[conversionDetails[i].path.length - 1];
          // amountAndFee is used to store _maxToSpend, useful to send enough tokens to this contract
          uTokens[k].amountAndFee = conversionDetails[i].maxToSpend;
          break;
        }
      }
    }

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

      // Payer pays the exact batch fees amount
      require(
        safeTransferFrom(
          uTokens[k].tokenAddress,
          _feeAddress,
          ((uTokens[k].amountAndFee - excessAmount) * batchConversionFee) / tenThousand
        ),
        'batch fee transferFrom() failed'
      );
    }
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
  function batchEthConversionPaymentsWithReference(
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
}
