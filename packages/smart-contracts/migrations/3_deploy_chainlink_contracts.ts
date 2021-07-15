const Currency = require('@requestnetwork/currency').default;
const AggDAI_USD = artifacts.require("AggDaiUsd.sol");
const AggETH_USD = artifacts.require("AggEthUsd");
const AggEUR_USD = artifacts.require("AggEurUsd");
const AggUSDT_ETH = artifacts.require("AggUsdtEth");
const USDT_fake = artifacts.require("UsdtFake");
const FakeSwapRouter = artifacts.require('FakeSwapRouter');
const ERC20SwapToConversion = artifacts.require('ERC20SwapToConversion');

const ERC20FeeProxy = artifacts.require('./ERC20FeeProxy.sol');
const ChainlinkConversionPath = artifacts.require("ChainlinkConversionPath");
const Erc20ConversionProxy = artifacts.require("Erc20ConversionProxy");


// Deploys, set up the contracts
module.exports = async function (deployer) {
  await deployer.deploy(AggDAI_USD);
  await deployer.deploy(AggETH_USD);
  await deployer.deploy(AggEUR_USD);
  await deployer.deploy(AggUSDT_ETH);
  await deployer.deploy(USDT_fake);

  // all these addresses are for test purposes
  const ETH_address = Currency.getCurrencyHash({ type: 'ETH', value: 'ETH' });
  const USD_address = Currency.getCurrencyHash({ type: 'ISO4217', value: 'USD' });
  const EUR_address = Currency.getCurrencyHash({ type: 'ISO4217', value: 'EUR' });
  // Cf. ERC20Alpha in TestERC20.sol
  const DAI_address = Currency.getCurrencyHash({ type: 'ERC20', value: '0x38cF23C52Bb4B13F051Aec09580a2dE845a7FA35' });
  const USDT_address = USDT_fake.address;

  const conversionPathInstance = await deployer.deploy(ChainlinkConversionPath);

  // all these aggregators are for test purposes
  await conversionPathInstance.updateAggregatorsList([DAI_address, EUR_address, ETH_address, USDT_address],
    [USD_address, USD_address, USD_address, ETH_address],
    [AggDAI_USD.address, AggEUR_USD.address, AggETH_USD.address, AggUSDT_ETH.address]);

  await deployer.deploy(Erc20ConversionProxy, ERC20FeeProxy.address, ChainlinkConversionPath.address);

  // erc20SwapConversion
  const erc20SwapConversion = await deployer.deploy(ERC20SwapToConversion, FakeSwapRouter.address, Erc20ConversionProxy.address);

  await erc20SwapConversion.approvePaymentProxyToSpend('0x38cF23C52Bb4B13F051Aec09580a2dE845a7FA35');
  await erc20SwapConversion.approveRouterToSpend('0x9FBDa871d559710256a2502A2517b794B482Db40');

};
