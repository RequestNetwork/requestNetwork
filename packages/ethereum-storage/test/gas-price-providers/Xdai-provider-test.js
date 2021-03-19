import { StorageTypes } from '@requestnetwork/types';
import XdaiGasPriceProvider from '../../src/gas-price-providers/Xdai-provider';
import XdaiGasPriceProvider from '../../src/gas-price-providers/Xdai-provider';

const bigNumber: any = require('bn.js');

let XdaiGasProvider: XdaiGasPriceProvider;

const apiCorrectResponse = {
  fast: '10.0',
  safeLow: '1.0',
  standard: '5.0'
};

const apiNotSafeGasPriceResponse = {
  fast: '0',
  safeLow: '1.0',
  standard: '10000'
};

describe('XdaiGasPriceProvider', () => {
  beforeEach(() => {
    XdaiGasProvider = new XdaiGasPriceProvider();
  });

  describe('getGasPrice', () => {
    it('allows to get the requested gas price', async () => {
      await expect(
        XdaiGasProvider.getGasPrice(StorageTypes.GasPriceType.SAFELOW)
      ).resolves.toEqual(new bigNumber(10000000000));

      await expect(
        etherchainProvider.getGasPrice(StorageTypes.GasPriceType.STANDARD)
      ).resolves.toEqual(new bigNumber(50000000000));

      await expect(
        etherchainProvider.getGasPrice(StorageTypes.GasPriceType.FAST)
      ).resolves.toEqual(new bigNumber(100000000000));
    });

    it('throws when gas price is not safe to use', async () => {
      // when arbitrarily  fixed price is always arbitrarily above max
      await expect(
        etherchainProvider.getGasPrice(StorageTypes.GasPriceType.FAST)
      )
        .toBe(10000000000000000000000)
        .rejects.toThrowError(`Xdai provided fixed  price not safe to use`);
    });
  });
});
