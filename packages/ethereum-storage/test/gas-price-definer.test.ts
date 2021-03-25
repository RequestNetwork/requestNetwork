/* eslint-disable no-magic-numbers */

import { StorageTypes } from '@requestnetwork/types';
import EthereumUtils from '../src/ethereum-utils';

import * as config from '../src/config';
import GasPriceDefiner from '../src/gas-price-definer';

import * as BigNumber from 'bn.js';

let gasPriceDefiner: GasPriceDefiner;

describe('GasPriceDefiner', () => {
  beforeEach(() => {
    gasPriceDefiner = new GasPriceDefiner();
  });

  describe('getGasPrice', () => {
    it('returns default gas price from config if network has no provider', async () => {
      gasPriceDefiner.gasPriceProviderList = {
        [StorageTypes.EthereumNetwork.MAINNET]: [
          { getGasPrice: () => Promise.resolve(new BigNumber(1)) },
        ],
      };
      const gasPrice = await gasPriceDefiner.getGasPrice(
        StorageTypes.GasPriceType.STANDARD,
        EthereumUtils.getEthereumNetworkNameFromId(StorageTypes.EthereumNetwork.RINKEBY),
      );

      expect(gasPrice).toEqual(config.getDefaultEthereumGasPrice());
    });

    it('returns gas price from appropriate gas provider', async () => {
      gasPriceDefiner.gasPriceProviderList = {
        [StorageTypes.EthereumNetwork.MAINNET]: [
          { getGasPrice: () => Promise.resolve(new BigNumber(1)) },
        ],
        [StorageTypes.EthereumNetwork.XDAI]: [
          { getGasPrice: () => Promise.resolve(new BigNumber(2)) },
        ],
      };
      const gasPrice = await gasPriceDefiner.getGasPrice(
        StorageTypes.GasPriceType.STANDARD,
        EthereumUtils.getEthereumNetworkNameFromId(StorageTypes.EthereumNetwork.XDAI),
      );

      expect(gasPrice).toEqual(new BigNumber(2));
    });

    it('returns default gas price from config if no provider is available', async () => {
      gasPriceDefiner.pollProviders = async (
        _type: StorageTypes.GasPriceType,
      ): Promise<BigNumber[]> => Promise.resolve([]);
      const gasPrice = await gasPriceDefiner.getGasPrice(
        StorageTypes.GasPriceType.STANDARD,
        EthereumUtils.getEthereumNetworkNameFromId(StorageTypes.EthereumNetwork.MAINNET),
      );

      expect(gasPrice).toEqual(config.getDefaultEthereumGasPrice());
    });

    it('returns the max of values returned by providers', async () => {
      gasPriceDefiner.gasPriceProviderList = {
        [StorageTypes.EthereumNetwork.MAINNET]: [
          { getGasPrice: () => Promise.resolve(new BigNumber(100)) },
          { getGasPrice: () => Promise.resolve(new BigNumber(200)) },
          { getGasPrice: () => Promise.resolve(new BigNumber(300)) },
          { getGasPrice: () => Promise.resolve(new BigNumber(40)) },
          { getGasPrice: () => Promise.resolve(new BigNumber(300)) },
        ],
      };

      const gasPrice = await gasPriceDefiner.getGasPrice(
        StorageTypes.GasPriceType.STANDARD,
        EthereumUtils.getEthereumNetworkNameFromId(StorageTypes.EthereumNetwork.MAINNET),
      );

      expect(gasPrice).toEqual(new BigNumber(300));
    });
  });

  describe('pollProviders', () => {
    it('returns an array containing value from each provider', async () => {
      gasPriceDefiner.gasPriceProviderList = {
        [StorageTypes.EthereumNetwork.MAINNET]: [
          { getGasPrice: () => Promise.resolve(new BigNumber(100)) },
          { getGasPrice: () => Promise.resolve(new BigNumber(500)) },
          { getGasPrice: () => Promise.resolve(new BigNumber(200)) },
          { getGasPrice: () => Promise.resolve(new BigNumber(300000)) },
        ],
      };

      await expect(
        gasPriceDefiner.pollProviders(
          StorageTypes.GasPriceType.STANDARD,
          StorageTypes.EthereumNetwork.MAINNET,
        ),
      ).resolves.toEqual([
        new BigNumber(100),
        new BigNumber(500),
        new BigNumber(200),
        new BigNumber(300000),
      ]);
    });

    it('returns empty array if there is no provider', async () => {
      gasPriceDefiner.gasPriceProviderList = { [StorageTypes.EthereumNetwork.MAINNET]: [] };

      await expect(
        gasPriceDefiner.pollProviders(
          StorageTypes.GasPriceType.STANDARD,
          StorageTypes.EthereumNetwork.MAINNET,
        ),
      ).resolves.toHaveLength(0);
    });

    it('handles failures and invalid returns', async () => {
      gasPriceDefiner.gasPriceProviderList = {
        [StorageTypes.EthereumNetwork.MAINNET]: [
          { getGasPrice: () => Promise.resolve(new BigNumber(100)) },
          { getGasPrice: () => Promise.reject(new Error('oops!')) },
          { getGasPrice: () => Promise.resolve(new BigNumber(500)) },
          { getGasPrice: () => Promise.resolve(null) },
        ],
      };

      await expect(
        gasPriceDefiner.pollProviders(
          StorageTypes.GasPriceType.STANDARD,
          StorageTypes.EthereumNetwork.MAINNET,
        ),
      ).resolves.toEqual([new BigNumber(100), new BigNumber(500)]);
    });
  });
});
