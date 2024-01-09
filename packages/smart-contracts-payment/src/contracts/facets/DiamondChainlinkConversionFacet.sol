// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import '@openzeppelin/contracts/access/AccessControl.sol';
import '../storage/AppStorage.sol';

import {LibChainlinkConversion} from '../libraries/LibChainlinkConversion.sol';
import {LibDiamond} from '../libraries/LibDiamond.sol';
import {IDiamondChainlinkConversion} from '../interfaces/IDiamondChainlinkConversion.sol';

/**
 * @title ChainlinkConversionPath
 *
 * @notice ChainlinkConversionPath is a contract computing currency conversion rates based on Chainlink aggretators
 */
contract DiamondChainlinkConversionFacet is IDiamondChainlinkConversion {
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
  ) external override {
    LibDiamond.enforceIsContractOwner();
    LibChainlinkConversion.ChainlinkConversionStorage
      storage conversionStorage = LibChainlinkConversion.getStorage();
    conversionStorage.aggregators[_input][_output] = _aggregator;
    emit AggregatorUpdated(_input, _output, _aggregator);
  }

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
  ) external override {
    require(_inputs.length == _outputs.length, 'arrays must have the same length');
    require(_inputs.length == _aggregators.length, 'arrays must have the same length');

    LibDiamond.enforceIsContractOwner();
    LibChainlinkConversion.ChainlinkConversionStorage
      storage conversionStorage = LibChainlinkConversion.getStorage();

    // For every conversions of the path
    for (uint256 i; i < _inputs.length; i++) {
      conversionStorage.aggregators[_inputs[i]][_outputs[i]] = _aggregators[i];
      emit AggregatorUpdated(_inputs[i], _outputs[i], _aggregators[i]);
    }
  }

  /**
   * @notice Computes the conversion of an amount through a list of intermediate conversions
   * @param _amountIn Amount to convert
   * @param _path List of addresses representing the currencies for the intermediate conversions
   * @return result The result after all the conversions
   * @return oldestRateTimestamp The oldest timestamp of the path
   */
  function getConversion(uint256 _amountIn, address[] calldata _path)
    external
    override
    returns (uint256 result, uint256 oldestRateTimestamp)
  {
    (uint256 rate, uint256 timestamp, uint256 decimals) = LibChainlinkConversion.getRate(_path);

    // initialize the result
    result = (_amountIn * rate) / decimals;

    oldestRateTimestamp = timestamp;
  }

  function getRate(address[] memory _path) external override returns (uint256 rate) {
    (rate, , ) = LibChainlinkConversion.getRate((_path));
  }
}
