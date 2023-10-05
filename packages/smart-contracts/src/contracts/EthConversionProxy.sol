// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import './ChainlinkConversionPath.sol';
import '@openzeppelin/contracts/security/ReentrancyGuard.sol';
import './legacy_openzeppelin/contracts/access/roles/WhitelistAdminRole.sol';

/**
 * @title EthConversionProxy
 * @notice This contract converts from chainlink then swaps ETH (or native token)
 *         before paying a request thanks to a conversion payment proxy.
 *         The inheritance from ReentrancyGuard is required to perform
 *         "transferExactEthWithReferenceAndFee" on the eth-fee-proxy contract
 */
contract EthConversionProxy is ReentrancyGuard, WhitelistAdminRole {
  address public paymentProxy;
  ChainlinkConversionPath public chainlinkConversionPath;
  address public nativeTokenHash;

  constructor(
    address _paymentProxyAddress,
    address _chainlinkConversionPathAddress,
    address _nativeTokenHash,
    address _owner
  ) {
    paymentProxy = _paymentProxyAddress;
    chainlinkConversionPath = ChainlinkConversionPath(_chainlinkConversionPathAddress);
    nativeTokenHash = _nativeTokenHash;
    renounceWhitelistAdmin();
    _addWhitelistAdmin(_owner);
  }

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
  ) external payable {
    require(
      _path[_path.length - 1] == nativeTokenHash,
      'payment currency must be the native token'
    );

    (uint256 amountToPay, uint256 amountToPayInFees) = getConversions(
      _path,
      _requestAmount,
      _feeAmount,
      _maxRateTimespan
    );

    // Pay the request and fees
    (bool status, ) = paymentProxy.delegatecall(
      abi.encodeWithSignature(
        'transferExactEthWithReferenceAndFee(address,uint256,bytes,uint256,address)',
        _to,
        amountToPay,
        _paymentReference,
        amountToPayInFees,
        _feeAddress
      )
    );

    require(status, 'paymentProxy transferExactEthWithReferenceAndFee failed');

    // Event to declare a transfer with a reference
    emit TransferWithConversionAndReference(
      _requestAmount,
      // request currency
      _path[0],
      _paymentReference,
      _feeAmount,
      _maxRateTimespan
    );
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

    // Get the amount to pay in the native token
    amountToPay = (_requestAmount * rate) / decimals;
    amountToPayInFees = (_feeAmount * rate) / decimals;
  }

  /**
   * @notice Update the conversion path contract used to fetch conversions
   * @param _chainlinkConversionPathAddress address of the conversion path contract
   */
  function updateConversionPathAddress(address _chainlinkConversionPathAddress)
    external
    onlyWhitelistAdmin
  {
    chainlinkConversionPath = ChainlinkConversionPath(_chainlinkConversionPathAddress);
  }

  /**
   * @notice Update the conversion proxy used to process the payment
   * @param _paymentProxyAddress address of the ETH conversion proxy
   */
  function updateConversionProxyAddress(address _paymentProxyAddress) external onlyWhitelistAdmin {
    paymentProxy = _paymentProxyAddress;
  }

  /**
   * @notice Update the native token hash
   * @param _nativeTokenHash hash of the native token represented as an eth address
   */
  function updateNativeTokenHash(address _nativeTokenHash) external onlyWhitelistAdmin {
    nativeTokenHash = _nativeTokenHash;
  }
}
