import { StorageTypes } from '@requestnetwork/types';
import { getSafeGasPriceLimit } from '../src/config';
import EthereumUtils from '../src/ethereum-utils';

import * as BigNumber from 'bn.js';

/* tslint:disable:no-unused-expression */

describe('Ethereum Utils', () => {
  describe('getEthereumNetworkNameFromId', () => {
    it('allows to get the correct network name', async () => {
      expect(
        EthereumUtils.getEthereumNetworkNameFromId(StorageTypes.EthereumNetwork.PRIVATE),
      ).toBe('private');
      expect(
        EthereumUtils.getEthereumNetworkNameFromId(StorageTypes.EthereumNetwork.MAINNET),
      ).toBe('mainnet');
      expect(
        EthereumUtils.getEthereumNetworkNameFromId(StorageTypes.EthereumNetwork.KOVAN),
      ).toBe('kovan');
      expect(
        EthereumUtils.getEthereumNetworkNameFromId(StorageTypes.EthereumNetwork.RINKEBY),
      ).toBe('rinkeby');
      expect(
        EthereumUtils.getEthereumNetworkNameFromId(StorageTypes.EthereumNetwork.XDAI),
      ).toBe('xdai');


      it(`should return undefined if the network doesn't exist`, async () => {
        expect(EthereumUtils.getEthereumNetworkNameFromId(2000)).toBeUndefined();
      });
    });

    describe('isGasPriceSafe', () => {
      it('should return true when a safe value is given', async () => {
        expect(EthereumUtils.isGasPriceSafe(new BigNumber(1))).toBe(true);
        expect(EthereumUtils.isGasPriceSafe(new BigNumber(1000))).toBe(true);
        expect(
          EthereumUtils.isGasPriceSafe(new BigNumber(parseInt(getSafeGasPriceLimit()) - 1)),
        ).toBe(true);
      });

      it('should return false when an unsafe value is given', async () => {
        expect(EthereumUtils.isGasPriceSafe(new BigNumber(0))).toBe(false);
        expect(EthereumUtils.isGasPriceSafe(new BigNumber(parseInt(getSafeGasPriceLimit())))).toBe(
          false,
        );
      });
    });
  });
