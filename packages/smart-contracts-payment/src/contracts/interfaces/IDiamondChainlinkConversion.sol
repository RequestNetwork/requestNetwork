// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import '@openzeppelin/contracts/access/AccessControl.sol';
import '../storage/AppStorage.sol';

import {LibChainlinkConversion} from '../libraries/LibChainlinkConversion.sol';
import {LibDiamond} from '../libraries/LibDiamond.sol';

/**
 * @title ChainlinkConversionPath
 *
 * @notice ChainlinkConversionPath is a contract computing currency conversion rates based on Chainlink aggretators
 */
interface IDiamondChainlinkConversion {
  struct ChainlinkConversionStorage {
    // Mapping of Chainlink aggregators (input currency => output currency => contract address)
    // input & output currencies are the addresses of the ERC20 contracts OR the sha3("currency code")
    mapping(address => mapping(address => address)) aggregators;
  }

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
    returns (uint256 result, uint256 oldestRateTimestamp);

  /**
   * @notice Computes the rate between two currencies using a path
   * @param _path List of addresses representing the currencies for the intermediate conversions
   * @return rate Rate between path first and last elements.
   */
  function getRate(address[] memory _path) external returns (uint256 rate);
}
