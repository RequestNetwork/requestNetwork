// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IDiamondPaymentConversion {
  // Event to declare a native payment with conversion
  event TransferWithConversion(
    uint256 amount,
    address currency,
    bytes indexed paymentReference,
    uint256 feeAmount,
    uint256 maxRateTimespan
  );

  // Event to declare an ERC20 payment with fees
  event TokenTransferWithConversion(
    address tokenAddress,
    address to,
    uint256 amount,
    bytes indexed paymentReference,
    uint256 feeAmount,
    address feeAddress
  );

  // Event to declare a native crypto transfer with fees
  event NativeTransferWithConversion(
    address to,
    uint256 amount,
    bytes indexed paymentReference,
    uint256 feeAmount,
    address feeAddress
  );

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
  ) external;

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
    address payable _to,
    uint256 _requestAmount,
    address[] calldata _path,
    bytes calldata _paymentReference,
    uint256 _feeAmount,
    address payable _feeAddress,
    uint256 _maxRateTimespan
  ) external payable;
}
