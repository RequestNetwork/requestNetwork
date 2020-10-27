pragma solidity ^0.5.0;

import 'openzeppelin-solidity/contracts/math/SafeMath.sol';

// Mock up for chainlink on private network
import './lib/MockPrivateChainlinkAggregatorCaller.sol';

// Chainlink aggregator for rinkeby
// import "./lib/RinkebyChainlinkAggregatorCaller.sol";

// Chainlink aggregator for mainnet
// import "./lib/MainnetChainlinkAggregatorCaller.sol";

import './interfaces/ERC20FeeProxy.sol';

/**
 * @title ProxyChangeCryptoFiat
 */
contract ProxyChangeCryptoFiat is ChainlinkAggregatorCaller {
    using SafeMath for uint256;

    address public paymentProxy;

    constructor(address _paymentProxyAddress) public {
        paymentProxy = _paymentProxyAddress;
    }

    // Event to declare a transfer with a reference
    event TransferWithReferenceAndFeeFromFiat(
        address tokenAddress,
        address to,
        uint256 amountFiat,
        FiatEnum currencyFiat,
        bytes indexed paymentReference,
        uint256 feesAmountFiat,
        address feeAddress
    );

    /**
     * @notice Performs an ERC20 token transfer with a reference computing the amount based on a fiat amount
     * @param _to Transfer recipient
     * @param _amountFiat Amount reference to transfer in fiat (8 decimals)
     * @param _currencyFiat currency of the amount reference
     * @param _currencyCrypto currency of the crypto to pay with
     * @param _paymentReference Reference of the payment related
     * @param _feesAmountFiat The amount of the payment fee in fiat (8 decimals)
     * @param _feeAddress The fee recipient
     * @param _maxCryptoToSpend amount max that we can spend on the behalf of the user
     */
    function transferFromWithReferenceAndFee(
        address _to,
        uint256 _amountFiat,
        FiatEnum _currencyFiat,
        CryptoEnum _currencyCrypto,
        bytes calldata _paymentReference,
        uint256 _feesAmountFiat,
        address _feeAddress,
        uint256 _maxCryptoToSpend
    ) external {
        require(_currencyCrypto != CryptoEnum.ETH, 'ETH not supported');

        uint256 conversionRate = computeConversionRate(_currencyFiat, _currencyCrypto);

        // Get the amount to pay in the crypto currency chosen
        uint256 amountToPay = _amountFiat.mul(conversionRate);
        uint256 amountToPayInFees = _feesAmountFiat.mul(conversionRate);

        // USDC and USDT are only 6 decimals instead of 18
        if (_currencyCrypto == CryptoEnum.USDC || _currencyCrypto == CryptoEnum.USDT) {
            // convert to 6 decimals
            amountToPay = amountToPay.div(1e12);
            amountToPayInFees = amountToPayInFees.div(1e12);
        }

        require(
            amountToPay.add(amountToPayInFees) <= _maxCryptoToSpend,
            'Amount to pay is over the user limit'
        );

        // Pay the request and fees
        (bool status, ) = paymentProxy.delegatecall(
            abi.encodeWithSignature(
                'transferFromWithReferenceAndFee(address,address,uint256,bytes,uint256,address)',
                getTokenAddress(_currencyCrypto),
                _to,
                amountToPay,
                _paymentReference,
                amountToPayInFees,
                _feeAddress
            )
        );
        require(status, 'transferFromWithReferenceAndFee failed');

        // Event to declare a transfer with a reference
        emit TransferWithReferenceAndFeeFromFiat(
            getTokenAddress(_currencyCrypto),
            _to,
            _amountFiat,
            _currencyFiat,
            _paymentReference,
            _feesAmountFiat,
            _feeAddress
        );
    }

    /**
     * @notice Compute conversion rate from a fiat amount to a crypto amount
     * @param _currencyFiat currency of the fiat amount
     * @param _currencyCrypto crypto currency wanted
     */
    function computeConversionRate(FiatEnum _currencyFiat, CryptoEnum _currencyCrypto)
        public
        view
        returns (uint256)
    {
        uint256 rateToUSD;
        // First, get the amount in USD
        if (_currencyFiat == FiatEnum.USD) {
            // 1 with 18 decimals
            rateToUSD = 1e18;
        } else {
            // rate 18 decimals
            rateToUSD = uint256(getChainlinkAggregatorFiatToUsd(_currencyFiat).latestAnswer()).mul(
                1e10
            );
        }

        // Then, compute the amount in the right crypto
        uint256 finalRate;
        if (_currencyCrypto == CryptoEnum.ETH || _currencyCrypto == CryptoEnum.DAI) {
            // Compute the amount from USD to the right crypto
            finalRate = rateToUSD.div(
                uint256(getChainlinkAggregatorCryptoToUsd(_currencyCrypto).latestAnswer())
            );
        } else {
            // Compute the amount from USD to ETH
            uint256 rateToETH = rateToUSD.mul(1e18).div(
                uint256(getChainlinkAggregatorCryptoToUsd(CryptoEnum.ETH).latestAnswer())
            );

            // Compute the amount from ETH to the right crypto
            finalRate = rateToETH.div(
                uint256(getChainlinkAggregatorCryptoToETH(_currencyCrypto).latestAnswer())
            );
        }

        return finalRate;
    }

    /**
     * @notice Compute conversion from a fiat amount to a crypto amount
     * @param _amountFiat amount of fiat (8 decimals)
     * @param _currencyFiat currency of the fiat amount
     * @param _currencyCrypto crypto currency wanted
     */
    function computeConversion(
        uint256 _amountFiat,
        FiatEnum _currencyFiat,
        CryptoEnum _currencyCrypto
    ) public view returns (uint256) {
        uint256 finalAmount = _amountFiat.mul(
            computeConversionRate(_currencyFiat, _currencyCrypto)
        );

        // USDC and USDT are only 6 decimals instead of 18
        if (_currencyCrypto == CryptoEnum.USDC || _currencyCrypto == CryptoEnum.USDT) {
            // convert to 6 decimals
            finalAmount = finalAmount.div(1e12);
        }
        return finalAmount;
    }
}
