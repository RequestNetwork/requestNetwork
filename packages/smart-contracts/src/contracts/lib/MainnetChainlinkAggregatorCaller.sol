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
 * @title ChainlinkAggregatorCaller for mainnet
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
        if (cryptoEnum == CryptoEnum.SUSD) {
            // SUSD/ETH
            return AggregatorInterface(0x8e0b7e6062272B5eF4524250bFFF8e5Bd3497757);
        }
        if (cryptoEnum == CryptoEnum.USDC) {
            // USDC/ETH
            return AggregatorInterface(0x986b5E1e1755e3C2440e960477f25201B0a8bbD4);
        }
        if (cryptoEnum == CryptoEnum.USDT) {
            // USDT/ETH
            return AggregatorInterface(0xEe9F2375b4bdF6387aa8265dD4FB8F16512A1d46);
        }
        revert('crypto not supported');
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
            return AggregatorInterface(0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419);
        }
        if (cryptoEnum == CryptoEnum.DAI) {
            // DAI/USD
            return AggregatorInterface(0xAed0c38402a5d19df6E4c03F4E2DceD6e29c1ee9);
        }
        revert('crypto not supported');
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
            return AggregatorInterface(0x77F9710E7d0A19669A13c055F62cd80d313dF022);
        }
        if (fiatEnum == FiatEnum.CHF) {
            // CHF/USD
            return AggregatorInterface(0x449d117117838fFA61263B61dA6301AA2a88B13A);
        }
        if (fiatEnum == FiatEnum.EUR) {
            // EUR/USD
            return AggregatorInterface(0xb49f677943BC038e9857d61E7d053CaA2C1734C1);
        }
        if (fiatEnum == FiatEnum.GBP) {
            // GBP/USD
            return AggregatorInterface(0x5c0Ab2d9b5a7ed9f470386e82BB36A3613cDd4b5);
        }
        if (fiatEnum == FiatEnum.JPY) {
            // JPY/USD
            return AggregatorInterface(0xBcE206caE7f0ec07b545EddE332A47C2F75bbeb3);
        }
        revert('fiat not supported');
    }

    /**
     * @notice Get token address from cryptoEnum
     * @param _currencyCrypto crypto currency wanted
     */
    function getTokenAddress(CryptoEnum cryptoEnum) internal pure returns (address) {
        if (cryptoEnum == CryptoEnum.DAI) {
            return 0x6B175474E89094C44Da98b954EedeAC495271d0F;
        }
        if (cryptoEnum == CryptoEnum.USDT) {
            return 0xdAC17F958D2ee523a2206206994597C13D831ec7;
        }
        if (cryptoEnum == CryptoEnum.USDC) {
            return 0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48;
        }
        if (cryptoEnum == CryptoEnum.SUSD) {
            return 0x57Ab1ec28D129707052df4dF418D58a2D46d5f51;
        }
        revert('Crypton not supported');
    }
}
