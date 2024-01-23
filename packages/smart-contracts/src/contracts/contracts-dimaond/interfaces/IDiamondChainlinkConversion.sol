// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import '@openzeppelin/contracts/access/AccessControl.sol';
import '../storage/AppStorage.sol';

import {LibDiamond} from '../libraries/LibDiamond.sol';

/**
 * @title ChainlinkConversionPath
 *
 * @notice ChainlinkConversionPath is a contract computing currency conversion rates based on Chainlink aggretators
 */
interface IDiamondChainlinkConversion {
  // declare a new aggregator
  event AggregatorUpdated(address _input, address _output, address _aggregator);

  /**
   * @notice Update an aggregator
   * @param _input address representing the input currency
   * @param _output address representing the output currency
   * @param _aggregator address of the aggregator contract
   */
  function updateAggregator(
    address _input,
    address _output,
    address _aggregator
  ) external;

  /**
   * @notice Update a list of aggregators
   * @param _inputs list of addresses representing the input currencies
   * @param _outputs list of addresses representing the output currencies
   * @param _aggregators list of addresses of the aggregator contracts
   */
  function updateAggregatorsList(
    address[] calldata _inputs,
    address[] calldata _outputs,
    address[] calldata _aggregators
  ) external;

  /**
   * @notice Computes the conversion of an amount through a list of intermediate conversions
   * @param _amountIn Amount to convert
   * @param _path List of addresses representing the currencies for the intermediate conversions
   * @return result The result after all the conversions
   * @return oldestRateTimestamp The oldest timestamp of the path
   */
  function getConversion(uint256 _amountIn, address[] calldata _path)
    external
    returns (uint256, uint256);

  /**
   * @notice Computes the rate between two currencies using a path
   * @param _path List of addresses representing the currencies for the intermediate conversions
   * @return rate Rate between path first and last elements.
   * @return oldestRateTimestamp oldest conversion timestamp
   * @return decimals rate decimals
   */
  function getRate(address[] memory _path)
    external
    view
    returns (
      uint256,
      uint256,
      uint256
    );
}
