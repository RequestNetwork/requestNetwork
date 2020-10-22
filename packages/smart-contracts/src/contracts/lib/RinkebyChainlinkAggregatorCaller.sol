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
 * @title ChainlinkAggregatorCaller for Rinkeby
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
    // SUSD/ETH not supported on rinkeby
    // USDC/ETH not supported on rinkeby
    // USDT/ETH not supported on rinkeby
    revert("crypto not supported");
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
    if (cryptoEnum == CryptoEnum.ETH) {
      // ETH/USD
      return AggregatorInterface(0x8A753747A1Fa494EC906cE90E9f37563A8AF630e);
    }
    if (cryptoEnum == CryptoEnum.DAI) {
      // DAI/USD
      return AggregatorInterface(0x2bA49Aaa16E6afD2a993473cfB70Fa8559B523cF);
    }
    revert("crypto not supported");
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
    if (fiatEnum == FiatEnum.AUD) {
      // AUD/USD
      return AggregatorInterface(0x21c095d2aDa464A294956eA058077F14F66535af);
    }
    if (fiatEnum == FiatEnum.CHF) {
      // CHF/USD
      return AggregatorInterface(0x5e601CF5EF284Bcd12decBDa189479413284E1d2);
    }
    if (fiatEnum == FiatEnum.EUR) {
      // EUR/USD
      return AggregatorInterface(0x78F9e60608bF48a1155b4B2A5e31F32318a1d85F);
    }
    if (fiatEnum == FiatEnum.GBP) {
      // GBP/USD
      return AggregatorInterface(0x7B17A813eEC55515Fb8F49F2ef51502bC54DD40F);
    }
    if (fiatEnum == FiatEnum.JPY) {
      // JPY/USD
      return AggregatorInterface(0x3Ae2F46a2D84e3D5590ee6Ee5116B80caF77DeCA);
    }
    revert("fiat not supported");
  }

  /**
   * @notice Get token address from cryptoEnum
   * @param _currencyCrypto crypto currency wanted
   */
  function getTokenAddress(CryptoEnum cryptoEnum) internal pure returns (address) {
    if (cryptoEnum == CryptoEnum.DAI) {
      return 0x5592EC0cfb4dbc12D3aB100b257153436a1f0FEa;
    }
    revert("Crypton not supported");
  }
}
