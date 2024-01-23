// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import '@openzeppelin/contracts/access/AccessControl.sol';
import '../storage/AppStorage.sol';

interface ERC20fraction {
  function decimals() external view returns (uint8);
}

interface AggregatorFraction {
  function decimals() external view returns (uint8);

  function latestAnswer() external view returns (int256);

  function latestTimestamp() external view returns (uint256);
}

/**
 * @title ChainlinkConversionPath
 *
 * @notice ChainlinkConversionPath is a contract computing currency conversion rates based on Chainlink aggretators
 */
library LibChainlinkConversion {
  bytes32 constant CHAINLINK_CONVERSION_STORAGE_POSITION = keccak256('chainlinkConversion.storage');

  uint256 constant PRECISION = 1e18;
  uint256 constant NATIVE_TOKEN_DECIMALS = 18;
  uint256 constant FIAT_DECIMALS = 8;

  struct ChainlinkConversionStorage {
    // Mapping of Chainlink aggregators (input currency => output currency => contract address)
    // input & output currencies are the addresses of the ERC20 contracts OR the sha3("currency code")
    mapping(address => mapping(address => address)) aggregators;
  }

  // declare a new aggregator
  event AggregatorUpdated(address _input, address _output, address _aggregator);

  // Return ChainlinkConversion storage struct for reading and writing
  function getStorage() internal pure returns (ChainlinkConversionStorage storage storageStruct) {
    bytes32 position = CHAINLINK_CONVERSION_STORAGE_POSITION;
    assembly {
      storageStruct.slot := position
    }
  }

  /**
   * @notice Computes the conversion rate from a list of currencies
   * @param _path List of addresses representing the currencies for the conversions
   * @return rate The rate
   * @return oldestRateTimestamp The oldest timestamp of the path
   * @return decimals of the conversion rate
   */
  function getRate(AppStorage memory s, address[] memory _path)
    internal
    view
    returns (
      uint256 rate,
      uint256 oldestRateTimestamp,
      uint256 decimals
    )
  {
    // initialize the result with 18 decimals (for more precision)
    rate = PRECISION;
    decimals = PRECISION;
    oldestRateTimestamp = block.timestamp;

    // For every conversion of the path
    for (uint256 i; i < _path.length - 1; i++) {
      (
        AggregatorFraction aggregator,
        bool reverseAggregator,
        uint256 decimalsInput,
        uint256 decimalsOutput
      ) = getAggregatorAndDecimals(s, _path[i], _path[i + 1]);

      // store the latest timestamp of the path
      uint256 currentTimestamp = aggregator.latestTimestamp();
      if (currentTimestamp < oldestRateTimestamp) {
        oldestRateTimestamp = currentTimestamp;
      }

      // get the rate of the current step
      uint256 currentRate = uint256(aggregator.latestAnswer());
      // get the number of decimals of the current rate
      uint256 decimalsAggregator = uint256(aggregator.decimals());

      // mul with the difference of decimals before the current rate computation (for more precision)
      if (decimalsAggregator > decimalsInput) {
        rate = rate * (10**(decimalsAggregator - decimalsInput));
      }
      if (decimalsAggregator < decimalsOutput) {
        rate = rate * (10**(decimalsOutput - decimalsAggregator));
      }

      // Apply the current rate (if path uses an aggregator in the reverse way, div instead of mul)
      if (reverseAggregator) {
        rate = (rate * (10**decimalsAggregator)) / currentRate;
      } else {
        rate = (rate * currentRate) / (10**decimalsAggregator);
      }

      // div with the difference of decimals AFTER the current rate computation (for more precision)
      if (decimalsAggregator < decimalsInput) {
        rate = rate / (10**(decimalsInput - decimalsAggregator));
      }
      if (decimalsAggregator > decimalsOutput) {
        rate = rate / (10**(decimalsAggregator - decimalsOutput));
      }
    }
  }

  /**
   * @notice Gets aggregators and decimals of two currencies
   * @param _input input Address
   * @param _output output Address
   * @return aggregator to get the rate between the two currencies
   * @return reverseAggregator true if the aggregator returned give the rate from _output to _input
   * @return decimalsInput decimals of _input
   * @return decimalsOutput decimals of _output
   */
  function getAggregatorAndDecimals(
    AppStorage memory s,
    address _input,
    address _output
  )
    internal
    view
    returns (
      AggregatorFraction aggregator,
      bool reverseAggregator,
      uint256 decimalsInput,
      uint256 decimalsOutput
    )
  {
    ChainlinkConversionStorage storage chainlinkStorage = getStorage();

    // Try to get the right aggregator for the conversion
    aggregator = AggregatorFraction(chainlinkStorage.aggregators[_input][_output]);
    reverseAggregator = false;

    // if no aggregator found we try to find an aggregator in the reverse way
    if (address(aggregator) == address(0x00)) {
      aggregator = AggregatorFraction(chainlinkStorage.aggregators[_output][_input]);
      reverseAggregator = true;
    }

    require(address(aggregator) != address(0x00), 'No aggregator found');

    // get the decimals for the two currencies
    decimalsInput = getDecimals(s, _input);
    decimalsOutput = getDecimals(s, _output);
  }

  /**
   * @notice Gets decimals from an address currency
   * @param _addr address to check
   * @return decimals number of decimals
   */
  function getDecimals(AppStorage memory s, address _addr)
    internal
    view
    returns (uint256 decimals)
  {
    // by default we assume it is fiat
    decimals = FIAT_DECIMALS;

    // if address is the hash of the ETH currency
    if (_addr == s.nativeTokenHash) {
      decimals = NATIVE_TOKEN_DECIMALS;
    } else if (isContract(_addr)) {
      // otherwise, we get the decimals from the erc20 directly
      decimals = ERC20fraction(_addr).decimals();
    }
  }

  /**
   * @notice Checks if an address is a contract
   * @param _addr Address to check
   * @return true if the address hosts a contract, false otherwise
   */
  function isContract(address _addr) internal view returns (bool) {
    uint32 size;
    // solium-disable security/no-inline-assembly
    assembly {
      size := extcodesize(_addr)
    }
    return (size > 0);
  }
}
