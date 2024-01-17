import { StorageTypes } from '@requestnetwork/types';
import { getSafeGasPriceLimit } from '../src/config';

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

    it(`should throw if the storage network is not supported`, async () => {
      expect(() => getEthereumStorageNetworkNameFromId(2000 as any)).toThrowError(
        'Unsupported storage chain: 2000',
      );
    });
  });

  describe('getEthereumStorageNetworkIdFromName', () => {
    it('allows to get the correct network name', async () => {
      expect(getEthereumStorageNetworkIdFromName('private')).toBe(
        StorageTypes.EthereumNetwork.PRIVATE,
      );
      expect(getEthereumStorageNetworkIdFromName('mainnet')).toBe(
        StorageTypes.EthereumNetwork.MAINNET,
      );
      expect(getEthereumStorageNetworkIdFromName('rinkeby')).toBe(
        StorageTypes.EthereumNetwork.RINKEBY,
      );
      expect(getEthereumStorageNetworkIdFromName('goerli')).toBe(
        StorageTypes.EthereumNetwork.GOERLI,
      );
      expect(getEthereumStorageNetworkIdFromName('xdai')).toBe(StorageTypes.EthereumNetwork.XDAI);
    });

    it(`should return undefined if the network is not supported for storage`, async () => {
      expect(getEthereumStorageNetworkIdFromName('avalanche')).toBeUndefined();
      expect(getEthereumStorageNetworkIdFromName('mumbai')).toBeUndefined();
    });
  });

  describe('isGasPriceSafe', () => {
    it('should return true when a safe value is given', async () => {
      expect(isGasPriceSafe(1n)).toBe(true);
      expect(isGasPriceSafe(1000n)).toBe(true);
      expect(isGasPriceSafe(BigInt(parseInt(getSafeGasPriceLimit()) - 1))).toBe(true);
    });

    it('should return false when an unsafe value is given', async () => {
      expect(isGasPriceSafe(0n)).toBe(false);
      expect(isGasPriceSafe(BigInt(parseInt(getSafeGasPriceLimit())))).toBe(false);
    });
  });
});
