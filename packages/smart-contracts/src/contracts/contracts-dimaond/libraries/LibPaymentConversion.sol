// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {LibPayment} from '../libraries/LibPayment.sol';
import {LibConversionGetter} from './LibConversionGetter.sol';

import '../storage/AppStorage.sol';

// Remember to add the loupe functions from DiamondLoupeFacet to the diamond.
// The loupe functions are required by the EIP2535 Diamonds standard

library LibPaymentConversion {
  function getPathLastElement(address[] memory _path) internal pure returns (address) {
    return _path[_path.length - 1];
  }

  function makeTokenPaymentWithConversion(
    AppStorage memory s,
    address _to,
    uint256 _requestAmount,
    address[] memory _path,
    uint256 _feeAmount,
    address _feeAddress,
    uint256 _maxToSpend,
    uint256 _maxRateTimespan
  ) internal returns (uint256 amountToPay, uint256 amountToPayInFees) {
    require(
      getPathLastElement(_path) != s.nativeTokenHash,
      'payment currency must not be the native token'
    );
    (amountToPay, amountToPayInFees) = LibConversionGetter.getConversions(
      _path,
      _requestAmount,
      _feeAmount,
      _maxRateTimespan
    );
    require(amountToPay + amountToPayInFees <= _maxToSpend, 'Amount to pay is over the user limit');
    LibPayment.makeTokenPaymentWithFees(
      getPathLastElement(_path),
      _to,
      amountToPay,
      amountToPayInFees,
      _feeAddress
    );
  }

  /**
   * @notice Performs an ETH transfer with a reference computing the payment amount based on the request amount
   * @param _to Transfer recipient of the payement
   * @param _requestAmount Request amount
   * @param _path Conversion path
   * @param _feeAmount The amount of the payment fee
   * @param _feeAddress The fee recipient
   * @param _maxRateTimespan Max time span with the oldestrate, ignored if zero
   */
  function makeNativePaymentWithConversion(
    AppStorage memory s,
    address payable _to,
    uint256 _requestAmount,
    address[] calldata _path,
    uint256 _feeAmount,
    address payable _feeAddress,
    uint256 _maxRateTimespan
  ) internal returns (uint256 amountToPay, uint256 amountToPayInFees) {
    require(
      getPathLastElement(_path) == s.nativeTokenHash,
      'payment currency must be the native token'
    );

    (amountToPay, amountToPayInFees) = LibConversionGetter.getConversions(
      _path,
      _requestAmount,
      _feeAmount,
      _maxRateTimespan
    );

    require(
      amountToPay + amountToPayInFees <= msg.value,
      'nativeTransferWithConversion failed: tx.value too low'
    );

    LibPayment.makeExactNativePaymentWithFees(_to, amountToPay, amountToPayInFees, _feeAddress);
  }
}
