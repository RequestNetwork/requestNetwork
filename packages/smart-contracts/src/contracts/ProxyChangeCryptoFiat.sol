pragma solidity ^0.5.0;

import 'openzeppelin-solidity/contracts/math/SafeMath.sol';
import 'openzeppelin-solidity/contracts/token/ERC20/IERC20.sol';

// Mock up for chainlink on private network
import './lib/MockPrivateChainlinkAggregatorCaller.sol';

// Chainlink aggregator for rinkeby
// import './lib/RinkebyChainlinkAggregatorCaller.sol';

// Chainlink aggregator for mainnet
// import './lib/MainnetChainlinkAggregatorCaller.sol';

/**
 * @title ProxyChangeCryptoFiat
 */
contract ProxyChangeCryptoFiat is ChainlinkAggregatorCaller {
    using SafeMath for uint256;

    // Event to declare a transfer with a reference
    event TransferWithReference(
        address tokenAddress,
        address to,
        uint256 amount,
        bytes indexed paymentReference,
        uint256 amountinCrypto
    );

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
        uint256 amountInUSD;

        // First, get the amount in USD
        if (_currencyFiat == FiatEnum.USD) {
            amountInUSD = _amountFiat;
        } else {
            // amount * rate / decimal
            amountInUSD = _amountFiat
                .mul(uint256(getChainlinkAggregatorFiatToUsd(_currencyFiat).latestAnswer()))
                .div(1e8);
        }

        // Then, compute the amount in the right crypto
        uint256 finalAmount;
        if (_currencyCrypto == CryptoEnum.ETH || _currencyCrypto == CryptoEnum.DAI) {
            // Compute the amount from USD to the right crypto
            // amount * decimal / rate
            finalAmount = amountInUSD.mul(1e18).div(
                uint256(getChainlinkAggregatorCryptoToUsd(_currencyCrypto).latestAnswer())
            );
        } else {
            // Compute the amount from USD to ETH
            // amount * decimal / rate
            uint256 amountInETH = amountInUSD.mul(1e18).div(
                uint256(getChainlinkAggregatorCryptoToUsd(CryptoEnum.ETH).latestAnswer())
            );

            // Compute the amount from ETH to the right crypto
            // amount * decimal / rate
            finalAmount = amountInETH.mul(1e18).div(
                uint256(getChainlinkAggregatorCryptoToETH(_currencyCrypto).latestAnswer())
            );

            // USDC and USDT are only 6 decimals instead of 18
            if (_currencyCrypto == CryptoEnum.USDC || _currencyCrypto == CryptoEnum.USDT) {
                // convert to 6 decimals
                finalAmount = finalAmount.div(1e12);
            }
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

        // Get the amount to pay in the crypto currency chosen
        uint256 amountToPay = computeConversion(_amountFiat, _currencyFiat, _currencyCrypto);
        require(amountToPay <= _maxCryptoToSpend, 'Amount to pay is over the user limit');

        // Make the ERC20 transfer
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
