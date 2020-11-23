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
  const ETH_address = "0x0000000000000000000000000000000000000000";
  const USD_address = Utils.crypto.last20bytesOfNormalizeKeccak256Hash({type: 'ISO4217', value: 'USD' });
  const EUR_address = Utils.crypto.last20bytesOfNormalizeKeccak256Hash({type: 'ISO4217', value: 'EUR' });
  const DAI_address = '0x6b175474e89094c44da98b954eedeac495271d0f';
  const USDT_address = USDT_fake.address;

  const conversionPathInstance = await deployer.deploy(ChainlinkConversionPath);

  // all these aggregators are for test purposes
  await conversionPathInstance.updateListAggregators( [DAI_address,         EUR_address,        ETH_address,        USDT_address], 
                                                      [USD_address,         USD_address,        USD_address,        ETH_address], 
                                                      [AggDAI_USD.address,  AggEUR_USD.address, AggETH_USD.address, AggUSDT_ETH.address]);
};
