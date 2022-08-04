// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import './interfaces/IERC20ConversionProxy.sol';
import './interfaces/IEthConversionProxy.sol';
import './ChainlinkConversionPath.sol';
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
  ChainlinkConversionPath public chainlinkConversionPath;

  uint256 public batchConversionFee;
  uint256 public basicFee;

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
  struct RequestInfo {
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
  struct RequestsInfoParent {
    address[] tokenAddresses;
    address[] recipients;
    uint256[] amounts;
    bytes[] paymentReferences;
    uint256[] feeAmounts;
  }

  /**
   * @dev Used by batchRouter to hold information for any kind of request.
   *  - paymentNetworkId requests are grouped by paymentType to be paid with the appropriate function.
   *    More details in batchRouter description.
   *  - requestsInfo all informations required for conversion requests to be paid (=> paymentNetworkId equal 0 or 3)
   *  - requestsInfoParent all informations required for None-conversion requests to be paid
   *    (=> paymentNetworkId equal 1, 2, or 4)
   */
  struct MetaRequestsInfo {
    uint256 paymentNetworkId;
    RequestInfo[] requestsInfo;
    RequestsInfoParent requestsInfoParent;
  }

  /**
   * @param _paymentErc20Proxy The address to the ERC20 fee payment proxy to use.
   * @param _paymentEthProxy The address to the Ethereum fee payment proxy to use.
   * @param _paymentErc20ConversionProxy The address of the ERC20 Conversion payment proxy to use.
   * @param _paymentEthConversionFeeProxy The address of the Ethereum Conversion payment proxy to use.
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
  ) BatchPaymentsPublic(_paymentErc20Proxy, _paymentEthProxy, _owner) {
    paymentErc20Proxy = IERC20FeeProxy(_paymentErc20Proxy);
    paymentEthProxy = IEthereumFeeProxy(_paymentEthProxy);

    paymentErc20ConversionProxy = IERC20ConversionProxy(_paymentErc20ConversionProxy);
    paymentEthConversionProxy = IEthConversionProxy(_paymentEthConversionFeeProxy);
    chainlinkConversionPath = ChainlinkConversionPath(_chainlinkConversionPathAddress);
    transferOwnership(_owner);

    basicFee = 0;
    batchFee = 0;
    batchConversionFee = 0;
  }

  /**
   * @notice Batch payments on different payment networks at once.
   * - batchERC20ConversionPaymentsMultiTokens, paymentNetworks: 0
   * - batchERC20PaymentsWithReference, paymentNetworks: 1
   * - batchERC20PaymentsMultiTokensWithReference, paymentNetworks: 2
   * - batchEthConversionPaymentsWithReference, paymentNetworks: 3
   * - batchEthPaymentsWithReference, paymentNetworks: 4
   * @param metaRequestsInfos contains paymentNetworkId and requestsInfo
   * @param _feeAddress The address of the proxy to send the fees
   * @dev batchRouter reduces gas consumption if you are using more than a single payment networks,
   *      else, it is more efficient to use the adapted batch function.
   */
  function batchRouter(MetaRequestsInfo[] calldata metaRequestsInfos, address _feeAddress)
    external
    payable
  {
    require(metaRequestsInfos.length < 4, 'more than 4 requestsinfo');
    for (uint256 i = 0; i < metaRequestsInfos.length; i++) {
      MetaRequestsInfo calldata metaRequestsInfo = metaRequestsInfos[i];
      if (metaRequestsInfo.paymentNetworkId == 0) {
        batchERC20ConversionPaymentsMultiTokens(metaRequestsInfo.requestsInfo, _feeAddress);
      } else if (metaRequestsInfo.paymentNetworkId == 1) {
        batchERC20PaymentsWithReference(
          metaRequestsInfo.requestsInfoParent.tokenAddresses[0],
          metaRequestsInfo.requestsInfoParent.recipients,
          metaRequestsInfo.requestsInfoParent.amounts,
          metaRequestsInfo.requestsInfoParent.paymentReferences,
          metaRequestsInfo.requestsInfoParent.feeAmounts,
          _feeAddress
        );
      } else if (metaRequestsInfo.paymentNetworkId == 2) {
        batchERC20PaymentsMultiTokensWithReference(
          metaRequestsInfo.requestsInfoParent.tokenAddresses,
          metaRequestsInfo.requestsInfoParent.recipients,
          metaRequestsInfo.requestsInfoParent.amounts,
          metaRequestsInfo.requestsInfoParent.paymentReferences,
          metaRequestsInfo.requestsInfoParent.feeAmounts,
          _feeAddress
        );
      } else if (metaRequestsInfo.paymentNetworkId == 3) {
        batchEthConversionPaymentsWithReference(
          metaRequestsInfo.requestsInfo,
          payable(_feeAddress)
        );
      } else if (metaRequestsInfo.paymentNetworkId == 4) {
        batchEthPaymentsWithReference(
          metaRequestsInfo.requestsInfoParent.recipients,
          metaRequestsInfo.requestsInfoParent.amounts,
          metaRequestsInfo.requestsInfoParent.paymentReferences,
          metaRequestsInfo.requestsInfoParent.feeAmounts,
          payable(_feeAddress)
        );
      } else {
        revert('wrong paymentNetworkId');
      }
    }
  }

  /**
   * @notice Transfers a batch of multiple ERC20 tokens with a reference with amount based on the request amount in fiat
   * @param requestsInfo list of requestInfo, each one containing all the information of a request
   * @param _feeAddress The fee recipient
   * @dev amountAndFee is an approximation of the amount and the fee to be paid, in order to get enough tokens.
   *                   The excess is sent back to the payer
   *      batchFeeAmount is an approximation for the same reason of amountAndFee
   */
  function batchERC20ConversionPaymentsMultiTokens(
    RequestInfo[] calldata requestsInfo,
    address _feeAddress
  ) public {
    // a list of unique tokens, with the sum of maxToSpend by token
    Token[] memory uTokens = new Token[](requestsInfo.length);
    for (uint256 i = 0; i < requestsInfo.length; i++) {
      for (uint256 k = 0; k < requestsInfo.length; k++) {
        // If the token is already in the existing uTokens list
        if (uTokens[k].tokenAddress == requestsInfo[i].path[requestsInfo[i].path.length - 1]) {
          uTokens[k].amountAndFee += requestsInfo[i].maxToSpend;
          break;
        }
        // If the token is not in the list (amountAndFee = 0)
        else if (uTokens[k].amountAndFee == 0 && (requestsInfo[i].maxToSpend) > 0) {
          uTokens[k].tokenAddress = requestsInfo[i].path[requestsInfo[i].path.length - 1];
          // amountAndFee is used to store _maxToSpend, useful to send enough tokens to this contract
          uTokens[k].amountAndFee = requestsInfo[i].maxToSpend;
          break;
        }
      }
    }

    IERC20 requestedToken;
    // For each token: check allowance, transfer funds on the contract and approve the paymentProxy to spend if needed
    for (uint256 k = 0; k < uTokens.length && uTokens[k].amountAndFee > 0; k++) {
      requestedToken = IERC20(uTokens[k].tokenAddress);
      uTokens[k].batchFeeAmount = (uTokens[k].amountAndFee * batchConversionFee) / 10000;
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
    for (uint256 i = 0; i < requestsInfo.length; i++) {
      RequestInfo memory rI = requestsInfo[i];
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
          ((((uTokens[k].amountAndFee - excessAmount) * 10000) / (10000 + basicFee)) *
            batchConversionFee) / 10000
        ),
        'batch fee transferFrom() failed'
      );
    }
  }

  /**
   * @notice Send a batch of ETH conversion payments with fees and paymentReferences to multiple accounts.
   *         If one payment fails, the whole batch is reverted.
   * @param requestsInfo List of requestInfos, each one containing all the information of a request.
   *                     _maxToSpend is not used in this function.
   * @param _feeAddress The fee recipient.
   * @dev It uses EthereumConversionProxy to pay an invoice and fees.
   *      Please:
   *        Note that if there is not enough ether attached to the function call,
   *        the following error is thrown: "revert paymentProxy transferExactEthWithReferenceAndFee failed"
   *        This choice reduces the gas significantly, by delegating the whole conversion to the payment proxy.
   */
  function batchEthConversionPaymentsWithReference(
    RequestInfo[] calldata requestsInfo,
    address payable _feeAddress
  ) public payable {
    uint256 contractBalance = address(this).balance;
    payerAuthorized = true;

    // Batch contract pays the requests through EthConversionProxy
    for (uint256 i = 0; i < requestsInfo.length; i++) {
      paymentEthConversionProxy.transferWithReferenceAndFee{value: address(this).balance}(
        payable(requestsInfo[i].recipient),
        requestsInfo[i].requestAmount,
        requestsInfo[i].path,
        requestsInfo[i].paymentReference,
        requestsInfo[i].feeAmount,
        _feeAddress,
        requestsInfo[i].maxRateTimespan
      );
    }

    // Check that batch contract has enough funds to pay batch conversion fees
    uint256 amountBatchFees = ((((contractBalance - address(this).balance) * 10000) /
      (10000 + basicFee)) * batchConversionFee) / 10000;
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
   * @notice Fees applied for basic invoice, 0.1% at Request Finance
   * @param _basicFee Between 0 and 10000, e.i: basicFee = 10 represent 0.10% of fees
   *         Update it cautiously.
   *         e.i: Only if the Request Finance 'basicFee' has evolve, which should be exceptional
   */
  function setBasicFee(uint256 _basicFee) external onlyOwner {
    basicFee = _basicFee;
  }

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
