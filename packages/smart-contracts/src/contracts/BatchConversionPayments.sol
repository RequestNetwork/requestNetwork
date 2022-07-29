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
 *              - Native token: as Eth, using EthConversionProxy and EthereumFeeProxy
 *          - to: multiple addresses
 *          - fees: conversion proxy fees and additional batch conversion fees are paid to the same address.
 *         batchRouter is the main function to batch every kind of payments at once.
 *         If one transaction of the batch fail, every transactions are reverted.
 * @dev Please notify than fees are now divided by 10_000 instead of 1_000 in previous version
 *      batchRouter is the main function, but others batch payment functions are "public" in order to do
 *      gas optimization in some cases.
 */
contract BatchConversionPayments is BatchPaymentsPublic {
  using SafeERC20 for IERC20;

  IERC20ConversionProxy conversionPaymentProxy;
  IEthConversionProxy conversionPaymentEthProxy;
  ChainlinkConversionPath public chainlinkConversionPath;

  // Between 0 and 10000, i.e: batchFee = 100 represent 1% of fee
  uint256 public batchConversionFee;
  uint256 public basicFee;

  /**
   * @dev Every informations of a request, excepted the feeAddress
   *   _recipient Recipients address of the payement
   *   _requestAmount Request amount in fiat
   *   _path Conversion path
   *   _paymentReference References of the payment related
   *   _feeAmount The amount in fiat of the payment fee
   *   _maxToSpend Amounts max in token that we can spend on the behalf of the user:
   *               it includes fee proxy but NOT the batchConversionFee
   *   _maxRateTimespan Max times span with the oldestrate, ignored if zero
   */
  struct RequestInfo {
    address _recipient;
    uint256 _requestAmount;
    address[] _path;
    bytes _paymentReference;
    uint256 _feeAmount;
    uint256 _maxToSpend;
    uint256 _maxRateTimespan;
  }

  /**
   * @dev It is the structure of the input for the function from contract BatchPaymentsPublic
   */
  struct RequestsInfoParent {
    address[] _tokenAddresses;
    address[] _recipients;
    uint256[] _amounts;
    bytes[] _paymentReferences;
    uint256[] _feeAmounts;
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

  struct Path {
    address[] _path;
    uint256 rate;
    uint256 decimals;
  }

  /**
   * @param _paymentErc20FeeProxy The address to the ERC20 payment proxy to use.
   * @param _paymentEthFeeProxy The address to the Ethereum payment proxy to use.
   * @param _paymentErc20ConversionFeeProxy The address of the ERC20 Conversion payment proxy to use.
   * @param _paymentEthConversionFeeProxy The address of the ETH Conversion payment proxy to use.
   * @param _chainlinkConversionPathAddress The address of the conversion path contract
   * @param _owner Owner of the contract.
   */
  constructor(
    address _paymentErc20FeeProxy,
    address _paymentEthFeeProxy,
    address _paymentErc20ConversionFeeProxy,
    address _paymentEthConversionFeeProxy,
    address _chainlinkConversionPathAddress,
    address _owner
  ) BatchPaymentsPublic(_paymentErc20FeeProxy, _paymentEthFeeProxy, _owner) {
    paymentErc20FeeProxy = IERC20FeeProxy(_paymentErc20FeeProxy);
    paymentEthFeeProxy = IEthereumFeeProxy(_paymentEthFeeProxy);

    conversionPaymentProxy = IERC20ConversionProxy(_paymentErc20ConversionFeeProxy);
    conversionPaymentEthProxy = IEthConversionProxy(_paymentEthConversionFeeProxy);
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
          metaRequestsInfo.requestsInfoParent._tokenAddresses[0],
          metaRequestsInfo.requestsInfoParent._recipients,
          metaRequestsInfo.requestsInfoParent._amounts,
          metaRequestsInfo.requestsInfoParent._paymentReferences,
          metaRequestsInfo.requestsInfoParent._feeAmounts,
          _feeAddress
        );
      } else if (metaRequestsInfo.paymentNetworkId == 2) {
        batchERC20PaymentsMultiTokensWithReference(
          metaRequestsInfo.requestsInfoParent._tokenAddresses,
          metaRequestsInfo.requestsInfoParent._recipients,
          metaRequestsInfo.requestsInfoParent._amounts,
          metaRequestsInfo.requestsInfoParent._paymentReferences,
          metaRequestsInfo.requestsInfoParent._feeAmounts,
          _feeAddress
        );
      } else if (metaRequestsInfo.paymentNetworkId == 3) {
        batchEthConversionPaymentsWithReference(
          metaRequestsInfo.requestsInfo,
          payable(_feeAddress)
        );
      } else if (metaRequestsInfo.paymentNetworkId == 4) {
        batchEthPaymentsWithReference(
          metaRequestsInfo.requestsInfoParent._recipients,
          metaRequestsInfo.requestsInfoParent._amounts,
          metaRequestsInfo.requestsInfoParent._paymentReferences,
          metaRequestsInfo.requestsInfoParent._feeAmounts,
          payable(_feeAddress)
        );
      } else {
        revert('wrong paymentNetworkId');
      }
    }
  }

  /**
   * @notice Transfers a batch of multiple ERC20 tokens with a reference with amount based on the request amount in fiat
   * @param requestsInfo list of requestInfo, each one containing every informations of a request.
   * @param _feeAddress The fee recipient
   */
  function batchERC20ConversionPaymentsMultiTokens(
    RequestInfo[] calldata requestsInfo,
    address _feeAddress
  ) public {
    // Aggregate _maxToSpend by token
    Token[] memory uTokens = new Token[](requestsInfo.length);
    for (uint256 i = 0; i < requestsInfo.length; i++) {
      for (uint256 k = 0; k < requestsInfo.length; k++) {
        // If the token is already in the existing uTokens list
        if (uTokens[k].tokenAddress == requestsInfo[i]._path[requestsInfo[i]._path.length - 1]) {
          uTokens[k].amountAndFee += requestsInfo[i]._maxToSpend;
          break;
        }
        // If the token is not in the list (amountAndFee = 0)
        else if (uTokens[k].amountAndFee == 0 && (requestsInfo[i]._maxToSpend) > 0) {
          uTokens[k].tokenAddress = requestsInfo[i]._path[requestsInfo[i]._path.length - 1];
          // amountAndFee is used to store _maxToSpend, useful to send enough tokens to this contract
          uTokens[k].amountAndFee = requestsInfo[i]._maxToSpend;
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
        'Not sufficient allowance for batch to pay'
      );
      require(requestedToken.balanceOf(msg.sender) >= uTokens[k].amountAndFee, 'not enough funds');
      require(
        requestedToken.balanceOf(msg.sender) >= uTokens[k].amountAndFee + uTokens[k].batchFeeAmount,
        'not enough funds to pay approximated batchConversionFee'
      );

      // Transfer the amount and fee required for the token on the batch conversion contract
      require(
        safeTransferFrom(uTokens[k].tokenAddress, address(this), uTokens[k].amountAndFee),
        'payment transferFrom() failed'
      );

      // Batch contract approves Erc20ConversionProxy to spend the token
      if (
        requestedToken.allowance(address(this), address(conversionPaymentProxy)) <
        uTokens[k].amountAndFee
      ) {
        approvePaymentProxyToSpend(uTokens[k].tokenAddress, address(conversionPaymentProxy));
      }
    }

    // Batch pays the requests using Erc20ConversionFeeProxy
    for (uint256 i = 0; i < requestsInfo.length; i++) {
      RequestInfo memory rI = requestsInfo[i];
      conversionPaymentProxy.transferFromWithReferenceAndFee(
        rI._recipient,
        rI._requestAmount,
        rI._path,
        rI._paymentReference,
        rI._feeAmount,
        _feeAddress,
        rI._maxToSpend,
        rI._maxRateTimespan
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

      // Payer pays batch fees amount
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
   * @notice Send a batch of Eth conversion payments w/fees with paymentReferences to multiple accounts.
   *         If one payment failed, the whole batch is reverted.
   * @param requestsInfo List of requestInfos, each one containing every informations of a request.
   *                     _maxToSpend is not used in this function.
   * @param _feeAddress The fee recipient.
   * @dev It uses EthereumConversionProxy to pay an invoice and fees.
   */
  function batchEthConversionPaymentsWithReference(
    RequestInfo[] calldata requestsInfo,
    address payable _feeAddress
  ) public payable {
    uint256 contractBalance = address(this).balance;
    // amountAndFeeToPay in native token (as ETH), is updated at each payment
    uint256 amountAndFeeToPay;

    // rPaths stores _path, rate, and decimals only once by path
    Path[] memory rPaths = new Path[](requestsInfo.length);
    for (uint256 i = 0; i < requestsInfo.length; i++) {
      RequestInfo memory rI = requestsInfo[i];
      for (uint64 k = 0; k < requestsInfo.length; k++) {
        // Check if the path is already known
        if (rPaths[k].rate > 0 && rPaths[k]._path[0] == rI._path[0]) {
          // use the already known rate and decimals from path already queried
          amountAndFeeToPay = amountAndFeeConversion(
            rI._requestAmount,
            rI._feeAmount,
            rPaths[k].rate,
            rPaths[k].decimals
          );
          break;
        } else if (i == k) {
          // set the path, and get the associated rate and decimals
          rPaths[i]._path = rI._path;
          (rPaths[i].rate, rPaths[i].decimals) = getRate(rI._path, rI._maxRateTimespan);
          amountAndFeeToPay = amountAndFeeConversion(
            rI._requestAmount,
            rI._feeAmount,
            rPaths[i].rate,
            rPaths[i].decimals
          );
          break;
        }
      }

      require(address(this).balance >= amountAndFeeToPay, 'not enough funds');

      // Batch contract pays the requests through EthConversionProxy
      conversionPaymentEthProxy.transferWithReferenceAndFee{value: amountAndFeeToPay}(
        payable(rI._recipient),
        rI._requestAmount,
        rI._path,
        rI._paymentReference,
        rI._feeAmount,
        _feeAddress,
        rI._maxRateTimespan
      );
    }

    // Check that batch contract has enough funds to pay batch conversion fees
    uint256 amountBatchFees = ((((contractBalance - address(this).balance) * 10000) /
      (10000 + basicFee)) * batchConversionFee) / 10000;
    require(address(this).balance >= amountBatchFees, 'not enough funds for batch conversion fees');

    // Batch contract pays batch fee
    _feeAddress.transfer(amountBatchFees);

    // Batch contract transfers the remaining ethers to the payer
    if (address(this).balance > 0) {
      (bool sendBackSuccess, ) = payable(msg.sender).call{value: address(this).balance}('');
      require(sendBackSuccess, 'Could not send remaining funds to the payer');
    }
  }

  /*
   * Helper functions
   */

  /**
   * @notice Calculate the amount of the conversion
   */
  function amountAndFeeConversion(
    uint256 requestAmount,
    uint256 requestFee,
    uint256 rate,
    uint256 decimals
  ) private pure returns (uint256) {
    return (requestAmount * rate) / decimals + (requestFee * rate) / decimals;
  }

  /**
   * @notice Get conversion rate and decimals from chainlink
   */
  function getRate(address[] memory _path, uint256 _maxRateTimespan)
    internal
    view
    returns (uint256, uint256)
  {
    (uint256 rate, uint256 oldestTimestampRate, uint256 decimals) = chainlinkConversionPath.getRate(
      _path
    );

    // Check rate timespan
    require(
      _maxRateTimespan == 0 || block.timestamp - oldestTimestampRate <= _maxRateTimespan,
      'aggregator rate is outdated'
    );
    return (rate, decimals);
  }

  /*
   * Admin functions to edit the conversion proxies address
   */

  /** fees applied on a single request */
  function setBasicFee(uint256 _basicFee) public onlyOwner {
    basicFee = _basicFee;
  }

  function setBatchConversionFee(uint256 _batchConversionFee) public onlyOwner {
    batchConversionFee = _batchConversionFee;
  }

  function setConversionPaymentProxy(address _paymentErc20ConversionFeeProxy) public onlyOwner {
    conversionPaymentProxy = IERC20ConversionProxy(_paymentErc20ConversionFeeProxy);
  }

  function setEthConversionPaymentProxy(address _paymentEthConversionFeeProxy) public onlyOwner {
    conversionPaymentEthProxy = IEthConversionProxy(_paymentEthConversionFeeProxy);
  }

  /**
   * @notice Update the conversion path contract used to fetch conversions
   * @param _chainlinkConversionPathAddress address of the conversion path contract
   */
  function setConversionPathAddress(address _chainlinkConversionPathAddress) external onlyOwner {
    chainlinkConversionPath = ChainlinkConversionPath(_chainlinkConversionPathAddress);
  }
}
