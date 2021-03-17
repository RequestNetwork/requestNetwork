// tslint:disable: no-magic-numbers

import { StorageTypes } from '@requestnetwork/types';
import EthereumUtils from '../src/ethereum-utils';

import * as config from '../src/config';
import GasPriceDefiner from '../src/gas-price-definer';

const bigNumber: any = require('bn.js');

let gasPriceDefiner: GasPriceDefiner;

describe('GasPriceDefiner', () => {
  beforeEach(() => {
    gasPriceDefiner = new GasPriceDefiner();
  });

  describe('getGasPrice', () => {
    it('returns default gas price from config if network is  ethereum testnet', async () => {
      const gasPrice = await gasPriceDefiner.getGasPrice(
        StorageTypes.GasPriceType.STANDARD,
        EthereumUtils.getEthereumNetworkNameFromId(StorageTypes.EthereumNetwork.RINKEBY),
      );

      expect(gasPrice).toBe(config.getDefaultEthereumGasPrice());
    });

    it('returns pricing from xdai as defined as  fixed values' , async() => {
      const gasPrice = await gasPriceDefiner.getGasPrice(
        StorageTypes.GasPriceType.FAST,
        EthereumUtils.getEthereumNetworkNameFromId(StorageTypes.EthereumNetwork.XDAI),
      );

      expect(gasPrice).toBe(2000000000);
    });


    it('returns default gas price from config if no provider is available for ethereum mainnet', async () => {
      gasPriceDefiner.pollProviders = async (
        _type: StorageTypes.GasPriceType,
      ): Promise<typeof bigNumber> => [];
      const gasPrice = await gasPriceDefiner.getGasPrice(
        StorageTypes.GasPriceType.STANDARD,
        EthereumUtils.getEthereumNetworkNameFromId(StorageTypes.EthereumNetwork.MAINNET),
      );

      expect(gasPrice).toBe(config.getDefaultEthereumGasPrice());
    });


    it('returns the values set by the xdai , without provider being required ', async () => {
      gasPriceDefiner.pollProviders = async (
        _type: StorageTypes.GasPriceType,
      ): Promise<typeof bigNumber> => [];
      const gasPrice = await gasPriceDefiner.getGasPrice(
        StorageTypes.GasPriceType.STANDARD,
        EthereumUtils.getEthereumNetworkNameFromId(StorageTypes.EthereumNetwork.XDAI),
      );
    
        expect(gasPrice).toBe(20);
    
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

      expect(gasPrice).toBe('300');
    });
  });
  
  describe('pollProviders', () => {
    
    it('returns the array containing value  of each gasPriceType of xdai', async () =>{
      gasPriceDefiner.gasPriceProviderList = [
        { getGasPrice: async(_type: StorageTypes.GasPriceType): Promise<typeof bigNumber> =>
        new bigNumber(10) },
        { getGasPrice: async(_type: StorageTypes.GasPriceType): Promise<typeof bigNumber> =>
          new bigNumber(20) },
          { getGasPrice: async(_type: StorageTypes.GasPriceType): Promise<typeof bigNumber> =>
            new bigNumber(50) }


        
        ] 
    
        await expect(
          gasPriceDefiner.pollProviders(StorageTypes.GasPriceType.STANDARD , EthereumUtils.getEthereumNetworkNameFromId[StorageTypes.EthereumNetwork.XDAI]),
        ).resolves.toEqual([
          new bigNumber(10),
          new bigNumber(20),
          new bigNumber(50)
        ]);
  
    
    
    
      });
    
    it('returns an array containing value from each provider of ethereum', async () => {
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
        gasPriceDefiner.pollProviders(StorageTypes.GasPriceType.STANDARD , EthereumUtils.getEthereumNetworkNameFromId[StorageTypes.EthereumNetwork.XDAI]),
      ).resolves.toEqual([
        new bigNumber(100),
        new bigNumber(500),
        new bigNumber(200),
        new bigNumber(300000),
      ]);
    });

    it('returns non empty array if there is no provider for the ethereum ', async () => {
      gasPriceDefiner.gasPriceProviderList = [];
      let txn_networkId  = EthereumUtils.getEthereumNetworkNameFromId(StorageTypes.EthereumNetwork.XDAI);
      if (txn_networkId) {
        await expect(
          gasPriceDefiner.pollProviders(StorageTypes.GasPriceType.FAST ,EthereumUtils.getEthereumNetworkNameFromId[StorageTypes.EthereumNetwork.XDAI]),
        ).resolves.toHaveLength(1);
        

      }
      
    });
  });
});
