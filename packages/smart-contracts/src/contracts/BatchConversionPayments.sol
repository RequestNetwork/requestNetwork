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

/**
 * @title BatchConversionPayments
 * @notice This contract makes multiple conversion payments with references, in one transaction:
 *          - on: ERC20 Payment Proxy of the Request Network protocol
 *          - to: multiple addresses
 *          - fees: ERC20 proxy fees and additional batch conversion fee are paid to the same address.
 *         If one transaction of the batch fail, every transactions are reverted.
 */
contract BatchConversionPayments is Ownable, ReentrancyGuard {
  using SafeERC20 for IERC20;

  IERC20ConversionProxy paymentProxy;
  ChainlinkConversionPath public chainlinkConversionPath;

  // @dev: Between 0 and 1000, i.e: batchFee = 10 represent 1% of fee
  uint256 public batchConversionFee;

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
   * @param _paymentErc20ConversionFeeProxy The address to the ERC20 Conversion payment proxy to use.
   * @param _owner Owner of the contract.
   */
  constructor(
    address _paymentErc20ConversionFeeProxy,
    address _chainlinkConversionPathAddress,
    address _owner
  ) {
    paymentProxy = IERC20ConversionProxy(_paymentErc20ConversionFeeProxy);
    chainlinkConversionPath = ChainlinkConversionPath(_chainlinkConversionPathAddress);
    transferOwnership(_owner);
    batchConversionFee = 0;
  }

  struct Token {
    address[] path;
    uint256 requestAmount;
    uint256 feeAmount;
    uint256 maxToSpend;
    uint256 maxRateTimespan;
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
  function batchERC20ConversionPaymentsMultiTokens(
    RequestInfo[] calldata requestsInfo,
    address _feeAddress
  ) external {
    // Create a list of unique tokens used and the amounts associated
    // Only considere tokens having: amounts + feeAmounts > 0
    // batchFeeAmount is the amount's sum, and then, batch fee rate is applied
    Token[] memory uniqueTokens = new Token[](requestsInfo.length);
    for (uint256 i = 0; i < requestsInfo.length; i++) {
      RequestInfo memory rI = requestsInfo[i];
      for (uint256 j = 0; j < requestsInfo.length; j++) {
        // If the token is already in the existing uniqueTokens list
        if (
          uniqueTokens[j].path.length > 0 &&
          uniqueTokens[j].path[0] == rI._path[0] &&
          uniqueTokens[j].path[uniqueTokens[j].path.length - 1] == rI._path[rI._path.length - 1]
        ) {
          uniqueTokens[j].requestAmount += rI._requestAmount;
          uniqueTokens[j].feeAmount += rI._feeAmount;
          uniqueTokens[j].maxToSpend += rI._maxToSpend;
          // Keep the lowest maxRateTimespan, above 0
          if (rI._maxRateTimespan > 0 && uniqueTokens[j].maxRateTimespan > rI._maxRateTimespan) {
            uniqueTokens[j].maxRateTimespan = rI._maxRateTimespan;
          }
          break;
        }
        // If the token is not in the list
        if (
          (uniqueTokens[j].requestAmount + uniqueTokens[j].feeAmount) == 0 &&
          (rI._requestAmount + rI._feeAmount) > 0
        ) {
          uniqueTokens[j].path = rI._path;
          uniqueTokens[j].requestAmount += rI._requestAmount;
          uniqueTokens[j].feeAmount += rI._feeAmount;
          uniqueTokens[j].maxToSpend = rI._maxToSpend;
          uniqueTokens[j].maxRateTimespan = rI._maxRateTimespan;
          break;
        }
      }
    }
    // IERC20 requestedTokenEEE = IERC20(requestsInfo[0]._path[requestsInfo[0]._path.length - 1]);
    // require(
    //     requestedTokenEEE.allowance(msg.sender, address(this)) <
    //       requestsInfo[0]._maxToSpend,
    //     'Not sufficient allowance for batch to pay EEE2'
    //   );

    // require sum(amountToPay) + sum(amountToPayInFees) + sum(amountToPayInBatchFees) <= sum(_maxToSpend)
    // uint256 aa = 6;

    // todo:&& (uniqueTokens[i].requestAmount + uniqueTokens[i].feeAmount) > 0 , is it useful???
    // The payer transfers tokens to the batch contract and pays batch fee
    for (
      uint256 i = 0;
      i < uniqueTokens.length && (uniqueTokens[i].requestAmount + uniqueTokens[i].feeAmount) > 0;
      i++
    ) {
      Token memory uT = uniqueTokens[i];
      // can call getConversions to make sure maxRateTimespan is OK. one fail would revert everything
      (uint256 amountToPay, uint256 amountToPayInFees) = getConversions(
        uT.path,
        uT.requestAmount,
        uT.feeAmount,
        uT.maxRateTimespan
      );

      // Transfer the amount and fee from the payer to the batch contract
      IERC20 requestedToken = IERC20(uT.path[uT.path.length - 1]);

      require(
        requestedToken.allowance(msg.sender, address(this)) >= amountToPay + amountToPayInFees,
        'Not sufficient allowance for batch to pay'
      );
      require(
        requestedToken.balanceOf(msg.sender) >= amountToPay + amountToPayInFees,
        'not enough funds'
      );
      require(
        requestedToken.balanceOf(msg.sender) >=
          ((amountToPay + amountToPayInFees) * (1000 + batchConversionFee)) / 1000,
        'not enough funds to pay batchConversionFee'
      );

      require(
        safeTransferFrom(
          uT.path[uT.path.length - 1],
          address(this),
          (amountToPay + amountToPayInFees)
        ),
        'payment transferFrom() failed'
      );
      // Batch contract approves Erc20ConversionProxy to spend the token
      if (
        requestedToken.allowance(address(this), address(paymentProxy)) <
        amountToPay + amountToPayInFees
      ) {
        approvePaymentProxyToSpend(uT.path[uT.path.length - 1]);
      }

      // Payer pays batch fee amount
      require(
        safeTransferFrom(
          uT.path[uT.path.length - 1],
          _feeAddress,
          (amountToPay * batchConversionFee) / 1000
        ),
        'batch conversion fee transferFrom() failed'
      );
    }

    // Transfer only the amount and fee required for the token on the batch conversion contract

    // Batch Conversion contract pays the requests using Erc20ConversionFeeProxy
    for (uint256 i = 0; i < requestsInfo.length; i++) {
      RequestInfo memory rI = requestsInfo[i];
      paymentProxy.transferFromWithReferenceAndFee(
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

    // TODO : do we need to send back some token? (because of maxToSpend vs reality...)
    // for (uint256 i = 0; i < uniqueTokens.length && (uniqueTokens[i].requestAmount + uniqueTokens[i].feeAmount) > 0; i++) {
    //   // todo
    // }
  }

  function getConversions(
    address[] memory _path,
    uint256 _requestAmount,
    uint256 _feeAmount,
    uint256 _maxRateTimespan
  ) internal view returns (uint256 amountToPay, uint256 amountToPayInFees) {
    (uint256 rate, uint256 oldestTimestampRate, uint256 decimals) = chainlinkConversionPath.getRate(
      _path
    );

    // Check rate timespan
    require(
      _maxRateTimespan == 0 || block.timestamp - oldestTimestampRate <= _maxRateTimespan,
      'aggregator rate is outdated'
    );

    // Get the amount to pay in the crypto currency chosen
    amountToPay = (_requestAmount * rate) / decimals;
    amountToPayInFees = (_feeAmount * rate) / decimals;
  }

  /**
   * @notice Authorizes the conveersion proxy to spend a new request currency (ERC20).
   * @param _erc20Address Address of an ERC20 used as the request currency.
   */
  function approvePaymentProxyToSpend(address _erc20Address) public {
    IERC20 erc20 = IERC20(_erc20Address);
    uint256 max = 2**256 - 1;
    erc20.safeApprove(address(paymentProxy), max);
    // todo correct here
    // erc20.safeApprove(address(0x38cF23C52Bb4B13F051Aec09580a2dE845a7FA35), max);
  }

  /**
   * @notice Call transferFrom ERC20 function and validates the return data of a ERC20 contract call.
   * @dev This is necessary because of non-standard ERC20 tokens that don't have a return value.
   * @return result The return value of the ERC20 call, returning true for non-standard tokens
   */
  function safeTransferFrom(
    address _tokenAddress,
    address _to,
    uint256 _amount
  ) internal returns (bool result) {
    /* solium-disable security/no-inline-assembly */
    // check if the address is a contract
    assembly {
      if iszero(extcodesize(_tokenAddress)) {
        revert(0, 0)
      }
    }

    // solium-disable-next-line security/no-low-level-calls
    (bool success, ) = _tokenAddress.call(
      abi.encodeWithSignature('transferFrom(address,address,uint256)', msg.sender, _to, _amount)
    );

    assembly {
      switch returndatasize()
      case 0 {
        // Not a standard erc20
        result := 1
      }
      case 32 {
        // Standard erc20
        returndatacopy(0, 0, 32)
        result := mload(0)
      }
      default {
        // Anything else, should revert for safety
        revert(0, 0)
      }
    }

    require(success, 'transferFrom() has been reverted');

    /* solium-enable security/no-inline-assembly */
    return result;
  }

  /*
   * Admin functions to edit the proxies address
   */

  function setBatchConversionFee(uint256 _batchConversionFee) public onlyOwner {
    batchConversionFee = _batchConversionFee;
  }

  function setPaymentProxy(address _paymentErc20ConversionFeeProxy) public onlyOwner {
    paymentProxy = IERC20ConversionProxy(_paymentErc20ConversionFeeProxy);
  }

  /**
   * @notice Update the conversion path contract used to fetch conversions
   * @param _chainlinkConversionPathAddress address of the conversion path contract
   */
  function setConversionPathAddress(address _chainlinkConversionPathAddress) external onlyOwner {
    chainlinkConversionPath = ChainlinkConversionPath(_chainlinkConversionPathAddress);
  }
}
