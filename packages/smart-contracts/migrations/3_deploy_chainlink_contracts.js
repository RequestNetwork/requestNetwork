const Utils = require('@requestnetwork/utils').default;
const AggDAI_USD = artifacts.require("AggDaiUsd.sol");
const AggETH_USD = artifacts.require("AggEthUsd");
const AggEUR_USD = artifacts.require("AggEurUsd");
const AggUSDT_ETH = artifacts.require("AggUsdtEth");
const USDT_fake = artifacts.require("UsdtFake");

const ChainlinkConversionPath = artifacts.require("ChainlinkConversionPath");

// Deploys, set up the contracts
module.exports = async function(deployer) {
  await deployer.deploy(AggDAI_USD);
  await deployer.deploy(AggETH_USD);
  await deployer.deploy(AggEUR_USD);
  await deployer.deploy(AggUSDT_ETH);
  await deployer.deploy(USDT_fake);

  // all these addresses are for test purposes
  const ETH_address = Utils.currency.getCurrencyHash({type: 'ETH', value:'ETH'});
  const USD_address = Utils.currency.getCurrencyHash({type: 'ISO4217', value: 'USD' });
  const EUR_address = Utils.currency.getCurrencyHash({type: 'ISO4217', value: 'EUR' });
  const DAI_address = Utils.currency.getCurrencyHash({type: 'ERC20', value:'0x38cF23C52Bb4B13F051Aec09580a2dE845a7FA35'});
  const USDT_address = USDT_fake.address;

  const conversionPathInstance = await deployer.deploy(ChainlinkConversionPath);

  // all these aggregators are for test purposes
  await conversionPathInstance.updateAggregatorsList( [DAI_address,         EUR_address,        ETH_address,        USDT_address], 
                                                      [USD_address,         USD_address,        USD_address,        ETH_address], 
                                                      [AggDAI_USD.address,  AggEUR_USD.address, AggETH_USD.address, AggUSDT_ETH.address]);
};
