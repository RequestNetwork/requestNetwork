import '@nomiclabs/hardhat-ethers';
import { CurrencyManager } from '@requestnetwork/currency';
import { deployOne } from '../utils/deploy-one';
import { BigNumber } from 'ethers';
import { DiamondChainlinkConversionFacet } from '../../src/types';
import { ERC20Addresses } from './setupERC20';

export const PRECISION_RATE = 100_000_000;
export const EUR_USD_RATE = BigNumber.from(1.2 * PRECISION_RATE);
export const ETH_USD_RATE = BigNumber.from(500 * PRECISION_RATE);
export const DAI_USD_RATE = BigNumber.from(1.01 * PRECISION_RATE);
export const USDT_ETH_RATE = BigNumber.from(0.002 * 1_000_000_000_000_000_000);

export const setupChainlinkFacet = async (
  chainlinkFacet: DiamondChainlinkConversionFacet,
  erc20Adresses: ERC20Addresses,
): Promise<void> => {
  const { address: AggDAI_USD_address } = await deployOne('AggregatorMock', {
    constructorArguments: [DAI_USD_RATE, 8, 60],
  });
  const { address: AggETH_USD_address } = await deployOne('AggregatorMock', {
    constructorArguments: [ETH_USD_RATE, 8, 60],
  });
  const { address: AggEUR_USD_address } = await deployOne('AggregatorMock', {
    constructorArguments: [EUR_USD_RATE, 8, 60],
  });
  const { address: AggUSDT_ETH_address } = await deployOne('AggregatorMock', {
    constructorArguments: [USDT_ETH_RATE, 18, 60],
  });

  const currencyManager = CurrencyManager.getDefault();
  // all these addresses are for test purposes
  const ETH_hash = currencyManager.fromSymbol('ETH-private')!.hash;
  const USD_hash = currencyManager.fromSymbol('USD')!.hash;
  const EUR_hash = currencyManager.fromSymbol('EUR')!.hash;

  // all these aggregators are for test purposes
  await chainlinkFacet.updateAggregatorsList(
    [erc20Adresses.ERC20TestAddress, EUR_hash, ETH_hash, erc20Adresses.ERC20UsdtAddress],
    [USD_hash, USD_hash, USD_hash, ETH_hash],
    [AggDAI_USD_address, AggEUR_USD_address, AggETH_USD_address, AggUSDT_ETH_address],
  );
};
