/* eslint-disable no-magic-numbers */

import { StorageTypes } from '@requestnetwork/types';
import EtherchainProvider from '../../src/gas-price-providers/etherchain-provider';

import axios from 'axios';

import { BigNumber } from 'ethers';

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
    jest.clearAllMocks();
  });

  describe('getGasPrice', () => {
    it('allows to get the requested gas price', async () => {
      jest.spyOn(axios, 'get').mockResolvedValue({ status: 200, data: apiCorrectResponse });

      // Test with each gas price type
      await expect(
        etherchainProvider.getGasPrice(StorageTypes.GasPriceType.SAFELOW),
      ).resolves.toEqual(BigNumber.from(1000000000));

      await expect(
        etherchainProvider.getGasPrice(StorageTypes.GasPriceType.STANDARD),
      ).resolves.toEqual(BigNumber.from(3500000000));

      await expect(etherchainProvider.getGasPrice(StorageTypes.GasPriceType.FAST)).resolves.toEqual(
        BigNumber.from(7000000000),
      );
    });

    it('throws when API is not available', async () => {
      jest.spyOn(axios, 'get').mockResolvedValue({ status: 400 });

      await expect(
        etherchainProvider.getGasPrice(StorageTypes.GasPriceType.STANDARD),
      ).rejects.toThrowError(
        `Etherchain error 400. Bad response from server ${etherchainProvider.providerUrl}`,
      );
    });

    it('throws when API returns a response with the incorrect format', async () => {
      jest
        .spyOn(axios, 'get')
        .mockResolvedValueOnce({ status: 200, data: apiIncorrectResponse })
        .mockResolvedValueOnce({ status: 200, data: apiUncompleteResponse })
        .mockResolvedValueOnce({ status: 200, data: apiNotANumber });

      // When format is incorrect
      await expect(
        etherchainProvider.getGasPrice(StorageTypes.GasPriceType.STANDARD),
      ).rejects.toThrowError(`Etherchain API response doesn't contain the correct format`);

      // When a field is missing
      await expect(
        etherchainProvider.getGasPrice(StorageTypes.GasPriceType.STANDARD),
      ).rejects.toThrowError(`Etherchain API response doesn't contain the correct format`);

      // When a field is not a number
      await expect(
        etherchainProvider.getGasPrice(StorageTypes.GasPriceType.STANDARD),
      ).rejects.toThrowError(`Etherchain API response doesn't contain the correct format`);
    });

    it('throws when API returns a response with a gas price not safe to use', async () => {
      jest.spyOn(axios, 'get').mockResolvedValue({ status: 200, data: apiNotSafeGasPriceResponse });

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
