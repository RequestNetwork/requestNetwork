// tslint:disable: no-magic-numbers
import { StorageTypes } from '@requestnetwork/types';
import EtherscanProvider from '../../src/gas-price-providers/etherscan-provider';

import * as fetchMock from 'fetch-mock';

const bigNumber: any = require('bn.js');

let etherscanProvider: EtherscanProvider;

const apiCorrectResponse = {
  status: '1',
  message: 'OK',
  result: {
    LastBlock: '10785932',
    SafeGasPrice: '10',
    ProposeGasPrice: '35',
    FastGasPrice: '70',
  },
};

const apiIncorrectResponse = {
  incorrect: 'response',
};

const apiIncompleteResponse = {
  status: '1',
  message: 'OK',
  result: {
    FastGasPrice: '70',
    SafeGasPrice: '10',
  },
};

const apiNotANumber = {
  status: '1',
  message: 'OK',
  result: {
    FastGasPrice: '70',
    ProposeGasPrice: 'not a number',
    SafeGasPrice: '10',
  },
};

const apiNotSafeGasPriceResponse = {
  status: '1',
  message: 'OK',
  result: {
    FastGasPrice: '0',
    ProposeGasPrice: '10000',
    SafeGasPrice: '10',
  },
};

const apiRateLimitResponse = {
  message: 'NOTOK',
  result: 'Max rate limit reached, please use API Key for higher rate limit',
  status: '0',
};

describe('EtherscanProvider', () => {
  beforeEach(() => {
    etherscanProvider = new EtherscanProvider();
  });

  describe('getGasPrice', () => {
    it('allows to get the requested gas price', async () => {
      const mock = fetchMock.sandbox().mock(etherscanProvider.providerUrl, apiCorrectResponse);
      etherscanProvider.fetch = mock as any;

      // Test with each gas price type
      await expect(
        etherscanProvider.getGasPrice(StorageTypes.GasPriceType.SAFELOW),
      ).resolves.toEqual(new bigNumber(10000000000));

      await expect(
        etherscanProvider.getGasPrice(StorageTypes.GasPriceType.STANDARD),
      ).resolves.toEqual(new bigNumber(35000000000));

      await expect(etherscanProvider.getGasPrice(StorageTypes.GasPriceType.FAST)).resolves.toEqual(
        new bigNumber(70000000000),
      );
    });

    it('throws when API is not available', async () => {
      const mock = fetchMock.sandbox().mock(etherscanProvider.providerUrl, 400);
      etherscanProvider.fetch = mock as any;

      await expect(
        etherscanProvider.getGasPrice(StorageTypes.GasPriceType.STANDARD),
      ).rejects.toThrowError(
        `Etherscan error 400. Bad response from server ${etherscanProvider.providerUrl}`,
      );
    });

    it('throws when API returns a response with the incorrect format', async () => {
      let mock = fetchMock.sandbox().mock(etherscanProvider.providerUrl, apiIncorrectResponse);
      etherscanProvider.fetch = mock as any;

      // When format is incorrect
      await expect(
        etherscanProvider.getGasPrice(StorageTypes.GasPriceType.STANDARD),
      ).rejects.toThrowError(`Etherscan API response doesn't contain the correct format`);

      mock = fetchMock.sandbox().mock(etherscanProvider.providerUrl, apiIncompleteResponse);
      etherscanProvider.fetch = mock as any;

      // When a field is missing
      await expect(
        etherscanProvider.getGasPrice(StorageTypes.GasPriceType.STANDARD),
      ).rejects.toThrowError(`Etherscan API response doesn't contain the correct format`);

      mock = fetchMock.sandbox().mock(etherscanProvider.providerUrl, apiNotANumber);
      etherscanProvider.fetch = mock as any;

      // When a field is not a number
      await expect(
        etherscanProvider.getGasPrice(StorageTypes.GasPriceType.STANDARD),
      ).rejects.toThrowError(`Etherscan API response doesn't contain the correct format`);

      mock = fetchMock.sandbox().mock(etherscanProvider.providerUrl, apiRateLimitResponse);
      etherscanProvider.fetch = mock as any;

      // When status is not 1
      await expect(
        etherscanProvider.getGasPrice(StorageTypes.GasPriceType.STANDARD),
      ).rejects.toThrowError(
        `Etherscan error: NOTOK Max rate limit reached, please use API Key for higher rate limit`,
      );
    });

    it('throws when API returns a response with a gas price not safe to use', async () => {
      const mock = fetchMock
        .sandbox()
        .mock(etherscanProvider.providerUrl, apiNotSafeGasPriceResponse);
      etherscanProvider.fetch = mock as any;

      // When over the limit
      await expect(
        etherscanProvider.getGasPrice(StorageTypes.GasPriceType.STANDARD),
      ).rejects.toThrowError(`Etherscan provided gas price not safe to use: 10000`);

      // When 0
      await expect(
        etherscanProvider.getGasPrice(StorageTypes.GasPriceType.FAST),
      ).rejects.toThrowError(`Etherscan provided gas price not safe to use: 0`);
    });
  });
});
