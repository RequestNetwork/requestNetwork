// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @title IEthConversionProxy
 * @notice This contract converts from chainlink then swaps ETH (or native token)
 *         before paying a request thanks to a conversion payment proxy.
 *         The inheritance from ReentrancyGuard is required to perform
 *         "transferExactEthWithReferenceAndFee" on the eth-fee-proxy contract
 */
interface IEthConversionProxy {
  // Event to declare a conversion with a reference
  event TransferWithConversionAndReference(
    uint256 amount,
    address currency,
    bytes indexed paymentReference,
    uint256 feeAmount,
    uint256 maxRateTimespan
  );

  // Event to declare a transfer with a reference
  // This event is emitted by this contract from a delegate call of the payment-proxy
  event TransferWithReferenceAndFee(
    address to,
    uint256 amount,
    bytes indexed paymentReference,
    uint256 feeAmount,
    address feeAddress
  );

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
  function transferWithReferenceAndFee(
    address _to,
    uint256 _requestAmount,
    address[] calldata _path,
    bytes calldata _paymentReference,
    uint256 _feeAmount,
    address _feeAddress,
    uint256 _maxRateTimespan
  ) external payable;
}
