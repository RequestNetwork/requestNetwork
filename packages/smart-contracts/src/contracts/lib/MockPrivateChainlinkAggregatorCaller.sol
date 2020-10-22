pragma solidity ^0.5.0;

interface AggregatorInterface {
  function latestAnswer() external view returns (int256);

  function latestTimestamp() external view returns (uint256);

  function latestRound() external view returns (uint256);

  function getAnswer(uint256 roundId) external view returns (int256);

  function getTimestamp(uint256 roundId) external view returns (uint256);

  event AnswerUpdated(int256 indexed current, uint256 indexed roundId, uint256 updatedAt);
  event NewRound(uint256 indexed roundId, address indexed startedBy, uint256 startedAt);
}


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
  function getChainlinkAggregatorCryptoToETH(CryptoEnum cryptoEnum)
    internal
    pure
    returns (AggregatorInterface)
  {
    if (cryptoEnum == CryptoEnum.USDT) {
      // USDT/ETH
      return AggregatorInterface(0xBd2c938B9F6Bfc1A66368D08CB44dC3EB2aE27bE);
    }
    revert("crypto not supported for eth conversion");
  }

  /**
   * @notice Get chainlink aggregator for a cyrpto to USD rate
   * @param _currencyCrypto crypto currency wanted
   */
  function getChainlinkAggregatorCryptoToUsd(CryptoEnum cryptoEnum)
    internal
    pure
    returns (AggregatorInterface)
  {
    if (cryptoEnum == CryptoEnum.DAI) {
      // DAI/USD
      return AggregatorInterface(0xB529f14AA8096f943177c09Ca294Ad66d2E08b1f);
    }
    if (cryptoEnum == CryptoEnum.ETH) {
      // ETH/USD
      return AggregatorInterface(0x3d49d1eF2adE060a33c6E6Aa213513A7EE9a6241);
    }
    revert("crypto not supported for usd conversion");
  }

  /**
   * @notice Get chainlink aggregator for a fiat to USD rate
   * @param _currencyFiat fiat currency wanted
   */
  function getChainlinkAggregatorFiatToUsd(FiatEnum fiatEnum)
    internal
    pure
    returns (AggregatorInterface)
  {
    if (fiatEnum == FiatEnum.EUR) {
      // EUR/USD
      return AggregatorInterface(0x2a504B5e7eC284ACa5b6f49716611237239F0b97);
    }
    revert("fiat not supported");
  }

  /**
   * @notice Get token address from cryptoEnum
   * @param _currencyCrypto crypto currency wanted
   */
  function getTokenAddress(CryptoEnum cryptoEnum) internal pure returns (address) {
    if (cryptoEnum == CryptoEnum.USDT) {
      // Test erc20
      return 0x9FBDa871d559710256a2502A2517b794B482Db40;
    }
    if (cryptoEnum == CryptoEnum.DAI) {
      // Test erc20
      return 0x9FBDa871d559710256a2502A2517b794B482Db40;
    }
    revert("token not supported");
  }
}
