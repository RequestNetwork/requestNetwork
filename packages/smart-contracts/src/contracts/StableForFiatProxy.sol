pragma solidity ^0.6.0;

import "@openzeppelin/contracts/math/SafeMath.sol"

/**
 * @dev Interface of the ERC20 standard as defined in the EIP.
 */
interface IERC20 {
    /**
     * @dev Returns the amount of tokens in existence.
     */
    function totalSupply() external view returns (uint256);

    /**
     * @dev Returns the amount of tokens owned by `account`.
     */
    function balanceOf(address account) external view returns (uint256);

    /**
     * @dev Moves `amount` tokens from the caller's account to `recipient`.
     *
     * Returns a boolean value indicating whether the operation succeeded.
     *
     * Emits a {Transfer} event.
     */
    function transfer(address recipient, uint256 amount) external returns (bool);

    /**
     * @dev Returns the remaining number of tokens that `spender` will be
     * allowed to spend on behalf of `owner` through {transferFrom}. This is
     * zero by default.
     *
     * This value changes when {approve} or {transferFrom} are called.
     */
    function allowance(address owner, address spender) external view returns (uint256);

    /**
     * @dev Sets `amount` as the allowance of `spender` over the caller's tokens.
     *
     * Returns a boolean value indicating whether the operation succeeded.
     *
     * IMPORTANT: Beware that changing an allowance with this method brings the risk
     * that someone may use both the old and the new allowance by unfortunate
     * transaction ordering. One possible solution to mitigate this race
     * condition is to first reduce the spender's allowance to 0 and set the
     * desired value afterwards:
     * https://github.com/ethereum/EIPs/issues/20#issuecomment-263524729
     *
     * Emits an {Approval} event.
     */
    function approve(address spender, uint256 amount) external returns (bool);

    /**
     * @dev Moves `amount` tokens from `sender` to `recipient` using the
     * allowance mechanism. `amount` is then deducted from the caller's
     * allowance.
     *
     * Returns a boolean value indicating whether the operation succeeded.
     *
     * Emits a {Transfer} event.
     */
    function transferFrom(
        address sender,
        address recipient,
        uint256 amount
    ) external returns (bool);

    /**
     * @dev Emitted when `value` tokens are moved from one account (`from`) to
     * another (`to`).
     *
     * Note that `value` may be zero.
     */
    event Transfer(address indexed from, address indexed to, uint256 value);

    /**
     * @dev Emitted when the allowance of a `spender` for an `owner` is set by
     * a call to {approve}. `value` is the new allowance.
     */
    event Approval(address indexed owner, address indexed spender, uint256 value);
}

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
 * @title ProxyChangeCryptoFiat
 */
contract ProxyChangeCryptoFiat {
    using SafeMath for uint256;

    // Event to declare a transfer with a reference
    event TransferWithReference(
        address tokenAddress,
        address to,
        uint256 amount,
        bytes indexed paymentReference,
        uint256 amountinCrypto
    );

    enum FiatEnum {USD, AUD, CHF, EUR, GBP, JPY}
    enum CryptoEnum {ETH, DAI, USDT, USDC, SUSD}

    function getChainlinkAggregatorCryptoToETH(CryptoEnum cryptoEnum)
        private
        view
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

    function getChainlinkAggregatorCryptoToUsd(CryptoEnum cryptoEnum)
        private
        view
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

    function getChainlinkAggregatorFiatToUsd(FiatEnum fiatEnum)
        private
        view
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

    function getTokenAddress(CryptoEnum cryptoEnum) private view returns (address) {
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

    function computeConversion(
        uint256 _amountFiat,
        FiatEnum _currencyFiat,
        CryptoEnum _currencyCrypto
    ) public view returns (uint256) {
        uint256 amountInUSD;
        if (_currencyFiat == FiatEnum.USD) {
            amountInUSD = _amountFiat;
        } else {
            // amount * rate / decimale
            amountInUSD = _amountFiat.mul(uint256(getChainlinkAggregatorFiatToUsd(_currencyFiat).latestAnswer())).div(8);
        }

        uint256 finalAmount;
        if (_currencyCrypto == CryptoEnum.ETH || _currencyCrypto == CryptoEnum.DAI) {
            // amount * decimale / rate
            finalAmount = amountInUSD.mul(8).div(uint256(getChainlinkAggregatorCryptoToUsd(_currencyCrypto).latestAnswer()));
        } else {
            // amount * decimale / rate
            uint256 amountInETH = amountInUSD.mul(8).div(uint256(getChainlinkAggregatorCryptoToUsd(_currencyCrypto).latestAnswer()));

            // amount * decimale / rate
            finalAmount = amountInETH.mul(18).div(uint256(getChainlinkAggregatorCryptoToETH(_currencyCrypto).latestAnswer()));
        }

        return finalAmount;
    }

    /**
     * @notice Performs a ERC20 token transfer with a reference computing the amount regarding a fiat amount
     * @param _to Transfer recipient
     * @param _amountFiat Amount reference to transfer in fiat (8 decimals)
     * @param _currencyFiat currency of the amount reference
     * @param _currencyCrypto currency of the crypto to pay with
     * @param _paymentReference Reference of the payment related
     * @param _maxCryptoToSpend amount max that we can spend on the behalf of the user
     */
    function transferWithReference(
        address _to,
        uint256 _amountFiat,
        FiatEnum _currencyFiat,
        CryptoEnum _currencyCrypto,
        bytes calldata _paymentReference,
        uint256 _maxCryptoToSpend
    ) external {
        // TODO !
        require(_currencyCrypto != CryptoEnum.ETH, 'ETH not supported yet');

        uint256 amountToPay = computeConversion(_amountFiat, _currencyFiat, _currencyCrypto);
        require(amountToPay <= _maxCryptoToSpend, 'Amount to pay over the user limit');

        IERC20 erc20 = IERC20(getTokenAddress(_currencyCrypto));
        require(
            erc20.allowance(msg.sender, address(this)) >= amountToPay,
            'allowance needed for the token transfer'
        );
        require(erc20.transferFrom(msg.sender, _to, amountToPay), 'transferFrom() failed');

        emit TransferWithReference(
            address(erc20),
            _to,
            _amountFiat,
            _paymentReference,
            amountToPay
        );
    }
}
