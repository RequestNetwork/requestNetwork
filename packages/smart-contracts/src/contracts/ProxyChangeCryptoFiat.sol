pragma solidity ^0.5.0;

import 'openzeppelin-solidity/contracts/math/SafeMath.sol';

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

    // #################################################################################
    // #################################################################################
    // Mock up of Chainlink aggregators for private network
    function getChainlinkAggregatorCryptoToETH(CryptoEnum cryptoEnum)
        public
        pure
        returns (AggregatorInterface)
    {
        if (cryptoEnum == CryptoEnum.USDT) {
            // USDT/ETH
            return AggregatorInterface(0x4e71920b7330515faf5EA0c690f1aD06a85fB60c);
        }
        revert('crypto not supported for eth conversion');
    }

    function getChainlinkAggregatorCryptoToUsd(CryptoEnum cryptoEnum)
        public
        pure
        returns (AggregatorInterface)
    {
        if (cryptoEnum == CryptoEnum.DAI) {
            // DAI/USD
            return AggregatorInterface(0x2EcA6FCFef74E2c8D03fBAf0ff6712314c9BD58B);
        }
        if (cryptoEnum == CryptoEnum.ETH) {
            // ETH/USD
            return AggregatorInterface(0x8ACEe021a27779d8E98B9650722676B850b25E11);
        }
        revert('crypto not supported for usd conversion');
    }

    function getChainlinkAggregatorFiatToUsd(FiatEnum fiatEnum)
        public
        pure
        returns (AggregatorInterface)
    {
        if (fiatEnum == FiatEnum.EUR) {
            // EUR/USD
            return AggregatorInterface(0xF328c11c4dF88d18FcBd30ad38d8B4714F4b33bF);
        }
        revert('fiat not supported');
    }

    function getTokenAddress(CryptoEnum cryptoEnum) public pure returns (address) {
        if (cryptoEnum == CryptoEnum.USDT) {
            // Test erc20
            return 0x38cF23C52Bb4B13F051Aec09580a2dE845a7FA35;
        }
        if (cryptoEnum == CryptoEnum.DAI) {
            // Test erc20
            return 0x38cF23C52Bb4B13F051Aec09580a2dE845a7FA35;
        }
        revert('token not supported');
    }

    // #################################################################################
    // #################################################################################

    // Mainnet chainlink aggregators
    // TODO !

    function computeConversion(
        uint256 _amountFiat,
        FiatEnum _currencyFiat,
        CryptoEnum _currencyCrypto
    ) public view returns (uint256) {
        uint256 amountInUSD;
        if (_currencyFiat == FiatEnum.USD) {
            amountInUSD = _amountFiat;
        } else {
            // amount * rate / decimal
            amountInUSD = _amountFiat
                .mul(uint256(getChainlinkAggregatorFiatToUsd(_currencyFiat).latestAnswer()))
                .div(1e8);
        }

        uint256 finalAmount;
        if (_currencyCrypto == CryptoEnum.ETH || _currencyCrypto == CryptoEnum.DAI) {
            // amount * decimal / rate
            finalAmount = amountInUSD.mul(1e18).div(
                uint256(getChainlinkAggregatorCryptoToUsd(_currencyCrypto).latestAnswer())
            );
        } else {
            // amount * decimal / rate
            uint256 amountInETH = amountInUSD.mul(1e18).div(
                uint256(getChainlinkAggregatorCryptoToUsd(CryptoEnum.ETH).latestAnswer())
            );

            // amount * decimal / rate
            finalAmount = amountInETH.mul(1e18).div(
                uint256(getChainlinkAggregatorCryptoToETH(_currencyCrypto).latestAnswer())
            );
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
        require(amountToPay <= _maxCryptoToSpend, 'Amount to pay is over the user limit');

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
