import { StorageTypes } from '@requestnetwork/types';
import { getSafeGasPriceLimit } from '../src/config';

import { BigNumber } from 'ethers';
import {
  getEthereumStorageNetworkIdFromName,
  getEthereumStorageNetworkNameFromId,
  isGasPriceSafe,
} from '../src/ethereum-utils';

/* eslint-disable @typescript-eslint/no-unused-expressions */

describe('Ethereum Utils', () => {
  describe('getEthereumStorageNetworkNameFromId', () => {
    it('allows to get the correct network name', async () => {
      expect(getEthereumStorageNetworkNameFromId(StorageTypes.EthereumNetwork.PRIVATE)).toBe(
        'private',
      );
      expect(getEthereumStorageNetworkNameFromId(StorageTypes.EthereumNetwork.MAINNET)).toBe(
        'mainnet',
      );
      expect(getEthereumStorageNetworkNameFromId(StorageTypes.EthereumNetwork.RINKEBY)).toBe(
        'rinkeby',
      );
      expect(getEthereumStorageNetworkNameFromId(StorageTypes.EthereumNetwork.GOERLI)).toBe(
        'goerli',
      );
      expect(getEthereumStorageNetworkNameFromId(StorageTypes.EthereumNetwork.XDAI)).toBe('xdai');
    });

    it(`should return undefined if the network doesn't exist`, async () => {
      expect(getEthereumStorageNetworkNameFromId(2000)).toBeUndefined();
    });
  });

  describe('getEthereumStorageNetworkIdFromName', () => {
    it('allows to get the correct network name', async () => {
      expect(getEthereumStorageNetworkIdFromName('private')).toBe(0);
      expect(getEthereumStorageNetworkIdFromName('mainnet')).toBe(1);
      expect(getEthereumStorageNetworkIdFromName('rinkeby')).toBe(4);
      expect(getEthereumStorageNetworkIdFromName('goerli')).toBe(5);
      expect(getEthereumStorageNetworkIdFromName('xdai')).toBe(100);
    });

    it(`should return undefined if the network is not supported for storage`, async () => {
      expect(getEthereumStorageNetworkIdFromName('aurora')).toBeUndefined();
      expect(getEthereumStorageNetworkIdFromName('mumbai')).toBeUndefined();
    });
  });

  describe('isGasPriceSafe', () => {
    it('should return true when a safe value is given', async () => {
      expect(isGasPriceSafe(BigNumber.from(1))).toBe(true);
      expect(isGasPriceSafe(BigNumber.from(1000))).toBe(true);
      expect(isGasPriceSafe(BigNumber.from(parseInt(getSafeGasPriceLimit()) - 1))).toBe(true);
    });

    it('should return false when an unsafe value is given', async () => {
      expect(isGasPriceSafe(BigNumber.from(0))).toBe(false);
      expect(isGasPriceSafe(BigNumber.from(parseInt(getSafeGasPriceLimit())))).toBe(false);
    });
  });
});
