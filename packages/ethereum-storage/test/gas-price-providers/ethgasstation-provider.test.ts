/* eslint-disable spellcheck/spell-checker */
// tslint:disable: no-magic-numbers

import { StorageTypes } from '@requestnetwork/types';
import EthGasStationProvider from '../../src/gas-price-providers/ethgasstation-provider';

import * as fetchMock from 'fetch-mock';

const bigNumber: any = require('bn.js');

let ethGasStationProvider: EthGasStationProvider;

const apiCorrectResponse = {
  average: '30.5',
  fast: '70',
  safeLow: '10',
};

const apiIncorrectResponse = {
  incorrect: 'response',
};

const apiUncompleteResponse = {
  fast: '70',
  safeLow: '10',
};

const apiNotANumber = {
  average: 'not a number',
  fast: '70',
  safeLow: '10',
};

const apiNotSafeGasPriceResponse = {
  average: '100000',
  fast: '0',
  safeLow: '10',
};

describe('EtherchainProvider', () => {
  beforeEach(() => {
    ethGasStationProvider = new EthGasStationProvider();
  });

  describe('getGasPrice', () => {
    it('allows to get the requested gas price', async () => {
      const mock = fetchMock.sandbox().mock(ethGasStationProvider.providerUrl, apiCorrectResponse);
      ethGasStationProvider.fetch = mock as any;

      // Test with each gas price type
      await expect(
        ethGasStationProvider.getGasPrice(StorageTypes.GasPriceType.SAFELOW),
      ).resolves.toEqual(new bigNumber(1000000000));

      await expect(
        ethGasStationProvider.getGasPrice(StorageTypes.GasPriceType.STANDARD),
      ).resolves.toEqual(new bigNumber(3050000000));

      await expect(
        ethGasStationProvider.getGasPrice(StorageTypes.GasPriceType.FAST),
      ).resolves.toEqual(new bigNumber(7000000000));
    });

    it('throws when API is not available', async () => {
      const mock = fetchMock.sandbox().mock(ethGasStationProvider.providerUrl, 400);
      ethGasStationProvider.fetch = mock as any;

      await expect(
        ethGasStationProvider.getGasPrice(StorageTypes.GasPriceType.STANDARD),
      ).rejects.toThrowError(
        `EthGasStation error 400. Bad response from server ${ethGasStationProvider.providerUrl}`,
      );
    });

    it('throws when API returns a response with the incorrect format', async () => {
      let mock = fetchMock.sandbox().mock(ethGasStationProvider.providerUrl, apiIncorrectResponse);
      ethGasStationProvider.fetch = mock as any;

      // When format is incorrect
      await expect(
        ethGasStationProvider.getGasPrice(StorageTypes.GasPriceType.STANDARD),
      ).rejects.toThrowError(`EthGasStation API response doesn't contain the correct format`);

      mock = fetchMock.sandbox().mock(ethGasStationProvider.providerUrl, apiUncompleteResponse);
      ethGasStationProvider.fetch = mock as any;

      // When a field is missing
      await expect(
        ethGasStationProvider.getGasPrice(StorageTypes.GasPriceType.STANDARD),
      ).rejects.toThrowError(`EthGasStation API response doesn't contain the correct format`);

      mock = fetchMock.sandbox().mock(ethGasStationProvider.providerUrl, apiNotANumber);
      ethGasStationProvider.fetch = mock as any;

      // When a field is not a number
      await expect(
        ethGasStationProvider.getGasPrice(StorageTypes.GasPriceType.STANDARD),
      ).rejects.toThrowError(`EthGasStation API response doesn't contain the correct format`);
    });

    it('throws when API returns a response with a gas price not safe to use', async () => {
      const mock = fetchMock
        .sandbox()
        .mock(ethGasStationProvider.providerUrl, apiNotSafeGasPriceResponse);
      ethGasStationProvider.fetch = mock as any;

      // When over the limit
      await expect(
        ethGasStationProvider.getGasPrice(StorageTypes.GasPriceType.STANDARD),
      ).rejects.toThrowError(`EthGasStation provided gas price not safe to use`);

      // When 0
      await expect(
        ethGasStationProvider.getGasPrice(StorageTypes.GasPriceType.FAST),
      ).rejects.toThrowError(`EthGasStation provided gas price not safe to use`);
    });
  });
});
