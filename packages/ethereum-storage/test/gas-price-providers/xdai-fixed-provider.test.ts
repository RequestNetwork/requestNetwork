import { StorageTypes } from '@requestnetwork/types';
import * as BigNumber from 'bn.js';
import XDaiFixedProvider from '../../src/gas-price-providers/xdai-fixed-provider';

describe('XDaiFixedProvider', () => {
  describe('getGasPrice', () => {
    it('allows to get the requested gas price', async () => {
      const provider = new XDaiFixedProvider();

      // Test with each gas price type
      await expect(provider.getGasPrice(StorageTypes.GasPriceType.SAFELOW)).resolves.toEqual(
        new BigNumber(1000000000),
      );

      await expect(provider.getGasPrice(StorageTypes.GasPriceType.STANDARD)).resolves.toEqual(
        new BigNumber(5000000000),
      );

      await expect(provider.getGasPrice(StorageTypes.GasPriceType.FAST)).resolves.toEqual(
        new BigNumber(10000000000),
      );
    });
  });
});
