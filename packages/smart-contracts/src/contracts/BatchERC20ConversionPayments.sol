// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import '@openzeppelin/contracts/token/ERC20/IERC20.sol';
import './lib/SafeERC20.sol';
import '@openzeppelin/contracts/access/Ownable.sol';
import './interfaces/ERC20FeeProxy.sol';
import './interfaces/EthereumFeeProxy.sol';
import '@openzeppelin/contracts/security/ReentrancyGuard.sol';
import './interfaces/IERC20ConversionProxy.sol';
import '@openzeppelin/contracts/token/ERC20/IERC20.sol';
import './ChainlinkConversionPath.sol';
import './BatchPaymentsPublic.sol';

/**
 * @title BatchConversionPayments
 * @notice This contract makes multiple conversion payments with references, in one transaction:
 *          - on: 
 *              - ERC20 tokens: using Erc20ConversionProxy and ERC20FeeProxy
 *              - Native token: as Eth, using EthConversionProxy and EthereumFeeProxy
 *          - to: multiple addresses
 *          - fees: conversion proxy fees and additional batch conversion fee are paid to the same address.
 *         If one transaction of the batch fail, every transactions are reverted.
 * @dev Please notify than fees are now divided by 10_000 instead of 1_000 in previous version
 */
contract BatchConversionPayments is BatchPaymentsPublic {
  using SafeERC20 for IERC20;

  IERC20ConversionProxy conversionPaymentProxy;
  ChainlinkConversionPath public chainlinkConversionPath;

  // @dev: Between 0 and 10000, i.e: batchFee = 100 represent 1% of fee
  uint256 public batchConversionFee;
  uint256 public basicFee;

  /**
    Every information of a request, excepted the feeAddress
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
   * It is the structure of the input for the function from contract BatchPaymentsPublic
   */
  struct RequestsInfoParent {
    address[] _tokenAddresses;
    address[] _recipients;
    uint256[] _amounts;
    bytes[] _paymentReferences;
    uint256[] _feeAmounts;
  }

  struct MetaRequestsInfo {
    uint256 paymentNetworkId;
    RequestInfo[] requestsInfo;
    RequestsInfoParent requestsInfoParent;
  }

  /**
   * @param _paymentErc20FeeProxy The address to the ERC20 payment proxy to use.
   * @param _paymentEthFeeProxy The address to the Ethereum payment proxy to use.
   * @param _paymentErc20ConversionFeeProxy The address of the ERC20 Conversion payment proxy to use.
   * @param _chainlinkConversionPathAddress The address of the conversion path contract
   * @param _owner Owner of the contract.
   */
  constructor(
    address _paymentErc20FeeProxy,
    address _paymentEthFeeProxy,
    address _paymentErc20ConversionFeeProxy,
    address _chainlinkConversionPathAddress,
    address _owner
  ) BatchPaymentsPublic(_paymentErc20FeeProxy, _paymentEthFeeProxy, _owner) {
    paymentErc20FeeProxy = IERC20FeeProxy(_paymentErc20FeeProxy);
    paymentEthFeeProxy = IEthereumFeeProxy(_paymentEthFeeProxy);

    conversionPaymentProxy = IERC20ConversionProxy(_paymentErc20ConversionFeeProxy);
    chainlinkConversionPath = ChainlinkConversionPath(_chainlinkConversionPathAddress);
    transferOwnership(_owner);

    basicFee = 0;
    batchFee = 0;
    batchConversionFee = 0;
  }

  /**
   * Batch payments on different payment network in the same time
   * - batchERC20ConversionPaymentsMultiTokens, paymentNetworks: 0
   * - batchERC20PaymentsWithReference, paymentNetworks: 1
   * - batchERC20PaymentsMultiTokensWithReference, paymentNetworks: 2
   * - batchEthPaymentsWithReference, paymentNetworks: 3
   * @param metaRequestsInfos contains paymentNetworkId and requestsInfo
   *  - paymentNetworkId requests are group by paymentType to be paid with the appropriate function
   *  - requestsInfo all information required for conversion requests to be paid
   *  - requestsInfoParent all information required for None-conversion requests to be paid
   * @param _feeAddress The address of the proxy to send the fees
   */
  function batchRouter(MetaRequestsInfo[] calldata metaRequestsInfos, address _feeAddress)
    external
  {
    require(metaRequestsInfos.length < 4, 'more than 4 requestsinfo');
    for (uint256 i = 0; i < metaRequestsInfos.length; i++) {
      MetaRequestsInfo calldata metaRequestsInfo = metaRequestsInfos[i];
      if (metaRequestsInfo.paymentNetworkId == 0) {
        batchERC20ConversionPaymentsMultiTokensEasy(metaRequestsInfo.requestsInfo, _feeAddress);
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
   * @notice Transfers a batch of ERC20 tokens with a reference with amount based on the request amount in fiat
   * @param requestsInfo containing every information of a request
   *   _recipient Transfer recipients of the payement
   *   _requestAmount Request amounts
   *   _path Conversion paths
   *   _paymentReference References of the payment related
   *   _feeAmount The amounts of the payment fee
   *   _maxToSpend Amounts max that we can spend on the behalf of the user: it includes fee proxy but NOT the batchCoversionFee
   *   _maxRateTimespan Max times span with the oldestrate, ignored if zero
   * @param _feeAddress The fee recipient
   */
  function batchERC20ConversionPaymentsMultiTokensEasy(
    RequestInfo[] calldata requestsInfo,
    address _feeAddress
  ) public {
    Token[] memory uTokens = new Token[](requestsInfo.length);
    for (uint256 j = 0; j < requestsInfo.length; j++) {
      for (uint256 k = 0; k < requestsInfo.length; k++) {
        // If the token is already in the existing uTokens list
        if (uTokens[k].tokenAddress == requestsInfo[j]._path[requestsInfo[j]._path.length - 1]) {
          uTokens[k].amountAndFee += requestsInfo[j]._maxToSpend;
          break;
        }
        // If the token is not in the list (amountAndFee = 0), and amount + fee > 0
        if (uTokens[k].amountAndFee == 0 && (requestsInfo[j]._maxToSpend) > 0) {
          uTokens[k].tokenAddress = requestsInfo[j]._path[requestsInfo[j]._path.length - 1];
          // amountAndFee is used to store _maxToSpend, useful to send enough tokens to this contract
          uTokens[k].amountAndFee = requestsInfo[j]._maxToSpend;
          break;
        }
      }
    }

    for (uint256 k = 0; k < uTokens.length && uTokens[k].amountAndFee > 0; k++) {
      IERC20 requestedToken = IERC20(uTokens[k].tokenAddress);
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
        approveConversionPaymentProxyToSpend(uTokens[k].tokenAddress);
      }
    }
    // Batch Conversion contract pays the requests using Erc20ConversionFeeProxy
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

    // batch send back to the payer the tokens not spent and pay the batch fee
    for (uint256 k = 0; k < uTokens.length && uTokens[k].amountAndFee > 0; k++) {
      IERC20 requestedToken = IERC20(uTokens[k].tokenAddress);

      // excessAmount = maxToSpend - reallySpent
      uint256 excessAmount = requestedToken.balanceOf(address(this));
      if (excessAmount > 0) {
        requestedToken.safeTransfer(msg.sender, excessAmount);
      }

      // Payer pays batch fee amount
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
   * Function to get fresh data from chainlinkConversionPath to do conversion.
   */
  function getRate(address[] memory _path, uint256 _maxRateTimespan)
    internal
    view
    returns (
      uint256,
      uint256,
      uint256
    )
  {
    (uint256 rate, uint256 oldestTimestampRate, uint256 decimals) = chainlinkConversionPath.getRate(
      _path
    );

    // Check rate timespan
    require(
      _maxRateTimespan == 0 || block.timestamp - oldestTimestampRate <= _maxRateTimespan,
      'aggregator rate is outdated'
    );
    return (rate, decimals, oldestTimestampRate);
  }

  /**
   * @notice Authorizes the conveersion proxy to spend a new request currency (ERC20).
   * @param _erc20Address Address of an ERC20 used as the request currency.
   */
  function approveConversionPaymentProxyToSpend(address _erc20Address) public {
    IERC20 erc20 = IERC20(_erc20Address);
    uint256 max = 2**256 - 1;
    erc20.safeApprove(address(conversionPaymentProxy), max);
  }

  /*
   * Admin functions to edit the conversion proxies address
   */

  /** fees applied on a single request*/
  function setBasicFee(uint256 _basicFee) public onlyOwner {
    basicFee = _basicFee;
  }

  function setBatchConversionFee(uint256 _batchConversionFee) public onlyOwner {
    batchConversionFee = _batchConversionFee;
  }

  function setConversionPaymentProxy(address _paymentErc20ConversionFeeProxy) public onlyOwner {
    conversionPaymentProxy = IERC20ConversionProxy(_paymentErc20ConversionFeeProxy);
  }

  /**
   * @notice Update the conversion path contract used to fetch conversions
   * @param _chainlinkConversionPathAddress address of the conversion path contract
   */
  function setConversionPathAddress(address _chainlinkConversionPathAddress) external onlyOwner {
    chainlinkConversionPath = ChainlinkConversionPath(_chainlinkConversionPathAddress);
  }
}
