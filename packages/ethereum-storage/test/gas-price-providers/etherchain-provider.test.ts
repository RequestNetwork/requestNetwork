/* eslint-disable spellcheck/spell-checker */
// tslint:disable: no-magic-numbers

import { StorageTypes } from '@requestnetwork/types';
import EtherchainProvider from '../../src/gas-price-providers/etherchain-provider';

import * as fetchMock from 'fetch-mock';

const bigNumber: any = require('bn.js');

let etherchainProvider: EtherchainProvider;

const apiCorrectResponse = {
  fast: '7.0',
  safeLow: '1.0',
  standard: '3.5',
};

const apiIncorrectResponse = {
  incorrect: 'response',
};

const apiUncompleteResponse = {
  fast: '7.0',
  safeLow: '1.0',
};

const apiNotANumber = {
  fast: '7.0',
  safeLow: '1.0',
  standard: 'not a number',
};

const apiNotSafeGasPriceResponse = {
  fast: '0',
  safeLow: '1.0',
  standard: '10000',
};

describe('EtherchainProvider', () => {
  beforeEach(() => {
    etherchainProvider = new EtherchainProvider();
  });

  describe('getGasPrice', () => {
    it('allows to get the requested gas price', async () => {
      const mock = fetchMock.sandbox().mock(etherchainProvider.providerUrl, apiCorrectResponse);
      etherchainProvider.fetch = mock as any;

      // Test with each gas price type
      await expect(
        etherchainProvider.getGasPrice(StorageTypes.GasPriceType.SAFELOW),
      ).resolves.toEqual(new bigNumber(1000000000));

      await expect(
        etherchainProvider.getGasPrice(StorageTypes.GasPriceType.STANDARD),
      ).resolves.toEqual(new bigNumber(3500000000));

      await expect(etherchainProvider.getGasPrice(StorageTypes.GasPriceType.FAST)).resolves.toEqual(
        new bigNumber(7000000000),
      );
    });

    it('throws when API is not available', async () => {
      const mock = fetchMock.sandbox().mock(etherchainProvider.providerUrl, 400);
      etherchainProvider.fetch = mock as any;

      await expect(
        etherchainProvider.getGasPrice(StorageTypes.GasPriceType.STANDARD),
      ).rejects.toThrowError(
        `Etherchain error 400. Bad response from server ${etherchainProvider.providerUrl}`,
      );
    });

    it('throws when API returns a response with the incorrect format', async () => {
      let mock = fetchMock.sandbox().mock(etherchainProvider.providerUrl, apiIncorrectResponse);
      etherchainProvider.fetch = mock as any;

      // When format is incorrect
      await expect(
        etherchainProvider.getGasPrice(StorageTypes.GasPriceType.STANDARD),
      ).rejects.toThrowError(`Etherchain API response doesn't contain the correct format`);

      mock = fetchMock.sandbox().mock(etherchainProvider.providerUrl, apiUncompleteResponse);
      etherchainProvider.fetch = mock as any;

      // When a field is missing
      await expect(
        etherchainProvider.getGasPrice(StorageTypes.GasPriceType.STANDARD),
      ).rejects.toThrowError(`Etherchain API response doesn't contain the correct format`);

      mock = fetchMock.sandbox().mock(etherchainProvider.providerUrl, apiNotANumber);
      etherchainProvider.fetch = mock as any;

      // When a field is not a number
      await expect(
        etherchainProvider.getGasPrice(StorageTypes.GasPriceType.STANDARD),
      ).rejects.toThrowError(`Etherchain API response doesn't contain the correct format`);
    });

    it('throws when API returns a response with a gas price not safe to use', async () => {
      const mock = fetchMock
        .sandbox()
        .mock(etherchainProvider.providerUrl, apiNotSafeGasPriceResponse);
      etherchainProvider.fetch = mock as any;

      // When over the limit
      await expect(
        etherchainProvider.getGasPrice(StorageTypes.GasPriceType.STANDARD),
      ).rejects.toThrowError(`Etherchain provided gas price not safe to use`);

      // When 0
      await expect(
        etherchainProvider.getGasPrice(StorageTypes.GasPriceType.FAST),
      ).rejects.toThrowError(`Etherchain provided gas price not safe to use`);
    });
  });
});
