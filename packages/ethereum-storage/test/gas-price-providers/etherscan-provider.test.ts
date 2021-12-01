/* eslint-disable no-magic-numbers */
import { StorageTypes } from '@requestnetwork/types';
import EtherscanProvider from '../../src/gas-price-providers/etherscan-provider';

import axios from 'axios';

import { BigNumber } from 'ethers';

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
      jest.spyOn(axios, 'get').mockResolvedValue({ status: 200, data: apiCorrectResponse });

      // Test with each gas price type
      await expect(
        etherscanProvider.getGasPrice(StorageTypes.GasPriceType.SAFELOW),
      ).resolves.toEqual(BigNumber.from(10000000000));

      await expect(
        etherscanProvider.getGasPrice(StorageTypes.GasPriceType.STANDARD),
      ).resolves.toEqual(BigNumber.from(35000000000));

      await expect(etherscanProvider.getGasPrice(StorageTypes.GasPriceType.FAST)).resolves.toEqual(
        BigNumber.from(70000000000),
      );
    });

    it('throws when API is not available', async () => {
      jest.spyOn(axios, 'get').mockResolvedValue({ status: 400 });

      await expect(
        etherscanProvider.getGasPrice(StorageTypes.GasPriceType.STANDARD),
      ).rejects.toThrowError(
        `Etherscan error 400. Bad response from server ${etherscanProvider.providerUrl}`,
      );
    });

    it('throws when API returns a response with the incorrect format', async () => {
      jest
        .spyOn(axios, 'get')
        .mockResolvedValueOnce({ status: 200, data: apiIncorrectResponse })
        .mockResolvedValueOnce({ status: 200, data: apiIncompleteResponse })
        .mockResolvedValueOnce({ status: 200, data: apiNotANumber })
        .mockResolvedValueOnce({ status: 200, data: apiRateLimitResponse });

      // When format is incorrect
      await expect(
        etherscanProvider.getGasPrice(StorageTypes.GasPriceType.STANDARD),
      ).rejects.toThrowError(`Etherscan API response doesn't contain the correct format`);

      // When a field is missing
      await expect(
        etherscanProvider.getGasPrice(StorageTypes.GasPriceType.STANDARD),
      ).rejects.toThrowError(`Etherscan API response doesn't contain the correct format`);

      // When a field is not a number
      await expect(
        etherscanProvider.getGasPrice(StorageTypes.GasPriceType.STANDARD),
      ).rejects.toThrowError(`Etherscan API response doesn't contain the correct format`);

      // When status is not 1
      await expect(
        etherscanProvider.getGasPrice(StorageTypes.GasPriceType.STANDARD),
      ).rejects.toThrowError(
        `Etherscan error: NOTOK Max rate limit reached, please use API Key for higher rate limit`,
      );
    });

    it('throws when API returns a response with a gas price not safe to use', async () => {
      jest.spyOn(axios, 'get').mockResolvedValue({ status: 200, data: apiNotSafeGasPriceResponse });

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
