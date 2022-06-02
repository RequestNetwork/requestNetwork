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
  constructor(address _paymentErc20ConversionFeeProxy, address _owner) {
    paymentProxy = IERC20ConversionProxy(_paymentErc20ConversionFeeProxy);
    transferOwnership(_owner);
    batchConversionFee = 0;
  }

  /**
   * @notice Transfers a batch of ERC20 tokens with a reference with amount based on the request amount in fiat
   * @param requestsInfo containing every information of a request
   *   _recipient Transfer recipients of the payement
   *   _requestAmount Request amounts
   *   _path Conversion paths
   *   _paymentReference References of the payment related
   *   _feeAmount The amounts of the payment fee
   *   _maxToSpend Amounts max that we can spend on the behalf of the user
   *   _maxRateTimespan Max times span with the oldestrate, ignored if zero
   * @param _feeAddress The fee recipient
   */
  function batchERC20ConversionPaymentsMultiTokens(
    RequestInfo[] calldata requestsInfo,
    address _feeAddress
  ) external {
    // require sum(amountToPay) + sum(amountToPayInFees) + sum(amountToPayInBatchFees) <= sum(_maxToSpend)
    // uint256 aa = 6;

    // Transfer only the amount and fee required for the token on the batch contract

    for (uint256 i = 0; i < requestsInfo.length; i++) {
      // Transfer the amount and fee from the payer to the batch contract
      // address paymentCurrency = requestsInfo[i]._path[requestsInfo[i]._path.length - 1];
      IERC20 requestedToken = IERC20(requestsInfo[i]._path[requestsInfo[i]._path.length - 1]);

      require(
        requestedToken.allowance(msg.sender, address(this)) >=
          requestsInfo[i]._requestAmount + requestsInfo[i]._feeAmount,
        'Not sufficient allowance for batch to pay'
      );
      require(
        requestedToken.balanceOf(msg.sender) >=
          requestsInfo[i]._requestAmount + requestsInfo[i]._feeAmount,
        'not enough funds'
      );

      require(
        safeTransferFrom(
          requestsInfo[i]._path[requestsInfo[i]._path.length - 1],
          address(this),
          requestsInfo[i]._requestAmount + requestsInfo[i]._feeAmount
        ),
        'payment transferFrom() failed'
      );
      // Batch contract approves Erc20ConversionProxy to spend the token
      if (
        requestedToken.allowance(address(this), address(paymentProxy)) <
        15 * requestsInfo[i]._requestAmount + requestsInfo[i]._feeAmount
      ) {
        approvePaymentProxyToSpend(requestsInfo[i]._path[requestsInfo[i]._path.length - 1]);
      }

      paymentProxy.transferFromWithReferenceAndFee(
        requestsInfo[i]._recipient,
        requestsInfo[i]._requestAmount,
        requestsInfo[i]._path,
        requestsInfo[i]._paymentReference,
        requestsInfo[i]._feeAmount,
        _feeAddress,
        requestsInfo[i]._maxToSpend,
        requestsInfo[i]._maxRateTimespan
      );
    }
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
    erc20.safeApprove(address(0x38cF23C52Bb4B13F051Aec09580a2dE845a7FA35), max);
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
}
