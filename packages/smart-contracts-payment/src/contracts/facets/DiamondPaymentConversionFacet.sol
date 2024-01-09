// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {IDiamondPaymentConversion} from '../interfaces/IDiamondPaymentConversion.sol';
import {LibPaymentConversion} from '../libraries/LibPaymentConversion.sol';
import {LibPayment} from '../libraries/LibPayment.sol';

import '../storage/AppStorage.sol';

// Remember to add the loupe functions from DiamondLoupeFacet to the diamond.
// The loupe functions are required by the EIP2535 Diamonds standard

contract DiamondPaymentConversionFacet is IDiamondPaymentConversion {
  AppStorage internal s;

  /** ------------------------------------------------------------ */
  /** ---------------------- ERC20 Payments ---------------------- */
  /** ------------------------------------------------------------ */

  /**
   * @notice Transfers ERC20 tokens with a reference with amount based on the request amount in fiat
   * @param _to Transfer recipient of the payement
   * @param _requestAmount Request amount
   * @param _path Conversion path
   * @param _paymentReference Reference of the payment related
   * @param _feeAmount The amount of the payment fee
   * @param _feeAddress The fee recipient
   * @param _maxToSpend Amount max that we can spend on the behalf of the user
   * @param _maxRateTimespan Max time span with the oldestrate, ignored if zero
   */
  function tokenTransferWithConversion(
    address _to,
    uint256 _requestAmount,
    address[] calldata _path,
    bytes calldata _paymentReference,
    uint256 _feeAmount,
    address _feeAddress,
    uint256 _maxToSpend,
    uint256 _maxRateTimespan
  ) external override {
    (uint256 amountToPay, uint256 amountToPayInFees) = LibPaymentConversion.getConversions(
      _path,
      _requestAmount,
      _feeAmount,
      _maxRateTimespan
    );

    require(amountToPay + amountToPayInFees <= _maxToSpend, 'Amount to pay is over the user limit');

    bool success = LibPayment.makeTokenPayment(
      _to,
      LibPaymentConversion.getPathLastElement(_path),
      _paymentReference,
      amountToPay,
      _feeAddress,
      amountToPayInFees
    );
    require(success, 'tokenTransferWithConversion failed: makeTokenPayment() failed');

    // Event to declare a transfer with conversion
    emit TransferWithConversion(
      _requestAmount,
      // request currency
      _path[0],
      _paymentReference,
      _feeAmount,
      _maxRateTimespan
    );
  }

  /** ------------------------------------------------------------ */
  /** ------------------ Native Crypto Payments ------------------ */
  /** ------------------------------------------------------------ */

  /**
   * @notice Performs an ETH transfer with a reference computing the payment amount based on the request amount
   * @param _to Transfer recipient of the payement
   * @param _requestAmount Request amount
   * @param _path Conversion path
   * @param _paymentReference Reference of the payment related
   * @param _feeAmount The amount of the payment fee
   * @param _feeAddress The fee recipient
   * @param _maxRateTimespan Max time span with the oldestrate, ignored if zero
   */
  function nativeTransferWithConversion(
    address _to,
    uint256 _requestAmount,
    address[] calldata _path,
    bytes calldata _paymentReference,
    uint256 _feeAmount,
    address _feeAddress,
    uint256 _maxRateTimespan
  ) external payable override {
    require(
      LibPaymentConversion.getPathLastElement(_path) == s.nativeTokenHash,
      'payment currency must be the native token'
    );

    (uint256 amountToPay, uint256 amountToPayInFees) = LibPaymentConversion.getConversions(
      _path,
      _requestAmount,
      _feeAmount,
      _maxRateTimespan
    );

    require(
      amountToPay + amountToPayInFees <= msg.value,
      'nativeTransferWithConversion failed: tx.value too low'
    );

    bool success = LibPayment.makeNativePayment(
      _to,
      amountToPay,
      _paymentReference,
      amountToPayInFees,
      _feeAddress
    );

    require(success, 'nativeTransferWithConversion failed: makeNativePayment() failed');

    // Event to declare a transfer with conversion
    emit TransferWithConversion(
      _requestAmount,
      // request currency
      _path[0],
      _paymentReference,
      _feeAmount,
      _maxRateTimespan
    );
  }
}
