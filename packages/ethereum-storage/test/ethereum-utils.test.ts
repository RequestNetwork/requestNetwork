import { StorageTypes } from '@requestnetwork/types';
import { getSafeGasPriceLimit } from '../src/config';
import EthereumUtils from '../src/ethereum-utils';

import { BigNumber } from 'ethers';

/* eslint-disable @typescript-eslint/no-unused-expressions */

describe('Ethereum Utils', () => {
  describe('getEthereumNetworkNameFromId', () => {
    it('allows to get the correct network name', async () => {
      expect(EthereumUtils.getEthereumNetworkNameFromId(StorageTypes.EthereumNetwork.PRIVATE)).toBe(
        'private',
      );
      expect(EthereumUtils.getEthereumNetworkNameFromId(StorageTypes.EthereumNetwork.MAINNET)).toBe(
        'mainnet',
      );
      expect(EthereumUtils.getEthereumNetworkNameFromId(StorageTypes.EthereumNetwork.KOVAN)).toBe(
        'kovan',
      );
      expect(EthereumUtils.getEthereumNetworkNameFromId(StorageTypes.EthereumNetwork.RINKEBY)).toBe(
        'rinkeby',
      );
      expect(EthereumUtils.getEthereumNetworkNameFromId(StorageTypes.EthereumNetwork.SOKOL)).toBe(
        'sokol',
      );
      expect(EthereumUtils.getEthereumNetworkNameFromId(StorageTypes.EthereumNetwork.XDAI)).toBe(
        'xdai',
      );
    });

    it(`should return undefined if the network doesn't exist`, async () => {
      expect(EthereumUtils.getEthereumNetworkNameFromId(2000)).toBeUndefined();
    });
  });

  describe('getEthereumIdFromNetworkName', () => {
    it('allows to get the correct network name', async () => {
      expect(EthereumUtils.getEthereumIdFromNetworkName('private')).toBe(
        StorageTypes.EthereumNetwork.PRIVATE,
      );
      expect(EthereumUtils.getEthereumIdFromNetworkName('mainnet')).toBe(
        StorageTypes.EthereumNetwork.MAINNET,
      );
      expect(EthereumUtils.getEthereumIdFromNetworkName('kovan')).toBe(
        StorageTypes.EthereumNetwork.KOVAN,
      );
      expect(EthereumUtils.getEthereumIdFromNetworkName('rinkeby')).toBe(
        StorageTypes.EthereumNetwork.RINKEBY,
      );
      expect(EthereumUtils.getEthereumIdFromNetworkName('sokol')).toBe(
        StorageTypes.EthereumNetwork.SOKOL,
      );
      expect(EthereumUtils.getEthereumIdFromNetworkName('xdai')).toBe(
        StorageTypes.EthereumNetwork.XDAI,
      );
    });

    it(`should return undefined if the network doesn't exist`, async () => {
      expect(EthereumUtils.getEthereumIdFromNetworkName('wrong')).toBeUndefined();
    });
  });

  describe('isGasPriceSafe', () => {
    it('should return true when a safe value is given', async () => {
      expect(EthereumUtils.isGasPriceSafe(BigNumber.from(1))).toBe(true);
      expect(EthereumUtils.isGasPriceSafe(BigNumber.from(1000))).toBe(true);
      expect(
        EthereumUtils.isGasPriceSafe(BigNumber.from(parseInt(getSafeGasPriceLimit()) - 1)),
      ).toBe(true);
    });

    it('should return false when an unsafe value is given', async () => {
      expect(EthereumUtils.isGasPriceSafe(BigNumber.from(0))).toBe(false);
      expect(EthereumUtils.isGasPriceSafe(BigNumber.from(parseInt(getSafeGasPriceLimit())))).toBe(
        false,
      );
    });
  });
});
