pragma solidity ^0.5.0;

import "./AggregatorInterface.sol";


/**
 * @title ChainlinkAggregatorCaller for private network
 */
contract ChainlinkAggregatorCaller {
  enum FiatEnum {USD, AUD, CHF, EUR, GBP, JPY}
  enum CryptoEnum {ETH, DAI, USDT, USDC, SUSD}

  /**
   * @notice Get chainlink aggregator for a cyrpto to ETH rate
   * @param _currencyCrypto crypto currency wanted
   */
  function getChainlinkAggregatorCryptoToETH(CryptoEnum _currencyCrypto)
    internal
    pure
    returns (AggregatorInterface)
  {
    if (_currencyCrypto == CryptoEnum.USDT) {
      // USDT/ETH
      return AggregatorInterface(0xBd2c938B9F6Bfc1A66368D08CB44dC3EB2aE27bE);
    }
    revert("crypto not supported for eth conversion");
  }

  /**
   * @notice Get chainlink aggregator for a cyrpto to USD rate
   * @param _currencyCrypto crypto currency wanted
   */
  function getChainlinkAggregatorCryptoToUsd(CryptoEnum _currencyCrypto)
    internal
    pure
    returns (AggregatorInterface)
  {
    if (_currencyCrypto == CryptoEnum.DAI) {
      // DAI/USD
      return AggregatorInterface(0xB529f14AA8096f943177c09Ca294Ad66d2E08b1f);
    }
    if (_currencyCrypto == CryptoEnum.ETH) {
      // ETH/USD
      return AggregatorInterface(0x3d49d1eF2adE060a33c6E6Aa213513A7EE9a6241);
    }
    revert("crypto not supported for usd conversion");
  }

  /**
   * @notice Get chainlink aggregator for a fiat to USD rate
   * @param _currencyFiat fiat currency wanted
   */
  function getChainlinkAggregatorFiatToUsd(FiatEnum _currencyFiat)
    internal
    pure
    returns (AggregatorInterface)
  {
    if (_currencyFiat == FiatEnum.EUR) {
      // EUR/USD
      return AggregatorInterface(0x2a504B5e7eC284ACa5b6f49716611237239F0b97);
    }
    revert("fiat not supported");
  }

  /**
   * @notice Get token address from _currencyCrypto
   * @param _currencyCrypto crypto currency wanted
   */
  function getTokenAddress(CryptoEnum _currencyCrypto) internal pure returns (address) {
    if (_currencyCrypto == CryptoEnum.USDT) {
      // Test erc20
      return 0x38cF23C52Bb4B13F051Aec09580a2dE845a7FA35;
    }
    if (_currencyCrypto == CryptoEnum.DAI) {
      // Test erc20
      return 0x38cF23C52Bb4B13F051Aec09580a2dE845a7FA35;
    }
    revert("token not supported");
  }
}
