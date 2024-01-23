// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import '../storage/AppStorage.sol';

// Remember to add the loupe functions from DiamondLoupeFacet to the diamond.
// The loupe functions are required by the EIP2535 Diamonds standard

/**
 * Utility library to convert a request and a fee amounts from a given currency to another using the Conversion Aggregator
 */
library LibConversionGetter {
  /**
   * @notice Converts amounts in the payment currency
   * @param _path Conversion path
   * @param _requestAmount The amount of the request
   * @param _feeAmount The amount of the payment fee
   * @param _maxRateTimespan Max time span with the oldest rate, ignored if zero
   */
  function getConversions(
    address[] memory _path,
    uint256 _requestAmount,
    uint256 _feeAmount,
    uint256 _maxRateTimespan
  ) internal returns (uint256 amountToPay, uint256 amountToPayInFees) {
    // Get the rate from the ChainlinkConversionFacet
    bytes4 getRateSelector = bytes4(keccak256('getRate(address[])'));
    bytes memory getRateCall = abi.encodeWithSelector(getRateSelector, _path);

    /**
     * Instead of using LibDiamond to retrieve the ChainlinkConversionFacet address and DELEGATECALL,
     * We make a CALL to the Diamond Proxy itself.
     * It allows to set the value to 0 which ensures that the call tu the method won't fail as it is not payable.
     * This would not have been possible using DELEGATECALL.
     */
    (bool success, bytes memory rateData) = address(this).call{value: 0}(getRateCall);
    require(success, 'Could not get conversion rate');

    (uint256 rate, uint256 oldestTimestampRate, uint256 decimals) = abi.decode(
      rateData,
      (uint256, uint256, uint256)
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
}
