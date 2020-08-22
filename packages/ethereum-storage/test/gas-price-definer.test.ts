import { StorageTypes } from '@requestnetwork/types';
import EthereumUtils from '../src/ethereum-utils';

import * as config from '../src/config';
import GasPriceDefiner from '../src/gas-price-definer';

import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';

const bigNumber: any = require('bn.js');

// Extends chai for promises
chai.use(chaiAsPromised);
const expect = chai.expect;

let gasPriceDefiner: GasPriceDefiner;

describe('GasPriceDefiner', () => {
  beforeEach(() => {
    gasPriceDefiner = new GasPriceDefiner();
  });

  describe('getGasPrice', () => {
    it('returns default gas price from config if network is not mainnet', async () => {
      const gasPrice = await gasPriceDefiner.getGasPrice(
        StorageTypes.GasPriceType.STANDARD,
        EthereumUtils.getEthereumNetworkNameFromId(StorageTypes.EthereumNetwork.RINKEBY),
      );

      expect(gasPrice).to.equals(config.getDefaultEthereumGasPrice());
    });

    it('returns default gas price from config if no provider is available', async () => {
      gasPriceDefiner.pollProviders = async (
        _type: StorageTypes.GasPriceType,
      ): Promise<typeof bigNumber> => [];
      const gasPrice = await gasPriceDefiner.getGasPrice(
        StorageTypes.GasPriceType.STANDARD,
        EthereumUtils.getEthereumNetworkNameFromId(StorageTypes.EthereumNetwork.MAINNET),
      );

      expect(gasPrice).to.equals(config.getDefaultEthereumGasPrice());
    });

    it('returns the max of values returned by providers', async () => {
      gasPriceDefiner.gasPriceProviderList = [
        {
          getGasPrice: async (_type: StorageTypes.GasPriceType): Promise<typeof bigNumber> =>
            new bigNumber(100),
          providerUrl: '',
        },
        {
          getGasPrice: async (_type: StorageTypes.GasPriceType): Promise<typeof bigNumber> =>
            new bigNumber(200),
          providerUrl: '',
        },
        {
          getGasPrice: async (_type: StorageTypes.GasPriceType): Promise<typeof bigNumber> =>
            new bigNumber(300),
          providerUrl: '',
        },
        {
          getGasPrice: async (_type: StorageTypes.GasPriceType): Promise<typeof bigNumber> =>
            new bigNumber(40),
          providerUrl: '',
        },
        {
          getGasPrice: async (_type: StorageTypes.GasPriceType): Promise<typeof bigNumber> =>
            new bigNumber(300),
          providerUrl: '',
        },
      ];

      const gasPrice = await gasPriceDefiner.getGasPrice(
        StorageTypes.GasPriceType.STANDARD,
        EthereumUtils.getEthereumNetworkNameFromId(StorageTypes.EthereumNetwork.MAINNET),
      );

      expect(gasPrice).to.equals('300');
    });
  });

  describe('pollProviders', () => {
    it('returns an array containing value from each provider', async () => {
      gasPriceDefiner.gasPriceProviderList = [
        {
          getGasPrice: async (_type: StorageTypes.GasPriceType): Promise<typeof bigNumber> =>
            new bigNumber(100),
          providerUrl: '',
        },
        {
          getGasPrice: async (_type: StorageTypes.GasPriceType): Promise<typeof bigNumber> =>
            new bigNumber(500),
          providerUrl: '',
        },
        {
          getGasPrice: async (_type: StorageTypes.GasPriceType): Promise<typeof bigNumber> =>
            new bigNumber(200),
          providerUrl: '',
        },
        {
          getGasPrice: async (_type: StorageTypes.GasPriceType): Promise<typeof bigNumber> =>
            new bigNumber(300000),
          providerUrl: '',
        },
      ];

      await expect(
        gasPriceDefiner.pollProviders(StorageTypes.GasPriceType.STANDARD),
      ).to.eventually.eql([
        new bigNumber(100),
        new bigNumber(500),
        new bigNumber(200),
        new bigNumber(300000),
      ]);
    });

    it('returns empty array if there is no provider', async () => {
      gasPriceDefiner.gasPriceProviderList = [];

      await expect(gasPriceDefiner.pollProviders(StorageTypes.GasPriceType.STANDARD)).to.be
        .eventually.empty;
    });
  });
});
