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

    it('returns  max pricing from xdai  payment' , async() => {
      gasPriceDefiner.gasPriceProviderList = [
       
        { getGasPrice: async(_type: StorageTypes.GasPriceType): Promise<typeof bigNumber> =>
          new bigNumber(5) ,
          providerUrl : '',
        
        },
          { getGasPrice: async(_type: StorageTypes.GasPriceType): Promise<typeof bigNumber> =>
            new bigNumber(10),
            providerUrl : '',
          },
            { getGasPrice: async(_type: StorageTypes.GasPriceType): Promise<typeof bigNumber> =>
              new bigNumber(20),
              providerUrl : '',
            }
              
        
        ] 
   

         
   
   
      const gasPrice = await gasPriceDefiner.getGasPrice(
        StorageTypes.GasPriceType.STANDARD,
        EthereumUtils.getEthereumNetworkNameFromId(StorageTypes.EthereumNetwork.XDAI),
      );

      expect(gasPrice).toBe(20);
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


   


    it('returns the max of values returned by ethereum providers', async () => {
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
            new bigNumber(500),
          providerUrl: '',
        },
      ];

      const gasPrice = await gasPriceDefiner.getGasPrice(
        StorageTypes.GasPriceType.STANDARD,
        EthereumUtils.getEthereumNetworkNameFromId(StorageTypes.EthereumNetwork.MAINNET),
      );

      expect(gasPrice).toBe('500');
    });
  });
  
  describe('pollProviders', () => {
    
    it('returns the array containing value  of each gasPriceType of xdai', async () =>{
      let networkName : String;
      gasPriceDefiner.gasPriceProviderList = [
       
        { getGasPrice: async(_type: StorageTypes.GasPriceType): Promise<typeof bigNumber> =>
          new bigNumber(5) },
        { getGasPrice: async(_type: StorageTypes.GasPriceType): Promise<typeof bigNumber> =>
          new bigNumber(50) }  
          

        
        ] 
        networkName =  EthereumUtils.getEthereumNetworkNameFromId(StorageTypes.EthereumNetwork.XDAI);
         
        await expect(
            gasPriceDefiner.pollProviders(StorageTypes.GasPriceType.STANDARD ,networkName),
        ).resolves.toEqual([
          new bigNumber(20),
          new bigNumber(50),
          new bigNumber(100),
        ]);

      });
    
    it('returns an array containing value from each provider of ethereum', async () => {
      let networkName : String;
      networkName = EthereumUtils.getEthereumNetworkNameFromId(StorageTypes.EthereumNetwork.MAINNET);
     
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
        gasPriceDefiner.pollProviders(StorageTypes.GasPriceType.STANDARD , networkName ),
      ).resolves.toEqual([
        new bigNumber(100),
        new bigNumber(500),
        new bigNumber(200),
        new bigNumber(300000),
      ]);
    });

    it('returns  empty array if there is no provider for the ethereum ', async () => {
      gasPriceDefiner.gasPriceProviderList = [];
      let txn_networkId  = EthereumUtils.getEthereumNetworkNameFromId(StorageTypes.EthereumNetwork.MAINNET);
      if (txn_networkId) {
        await expect(
          gasPriceDefiner.pollProviders(StorageTypes.GasPriceType.FAST ,EthereumUtils.getEthereumNetworkNameFromId(StorageTypes.EthereumNetwork.MAINNET)),
        ).resolves.toHaveLength(0);
        

      }
      
    });
  });
});
