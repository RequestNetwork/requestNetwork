/* eslint-disable no-magic-numbers */

import { StorageTypes } from '@requestnetwork/types';
import EthGasStationProvider from '../../src/gas-price-providers/ethgasstation-provider';

import Axios from 'axios';

import { BigNumber } from 'ethers';

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
      jest.spyOn(Axios, 'get').mockResolvedValue({ status: 200, data: apiCorrectResponse });

      // Test with each gas price type
      await expect(
        ethGasStationProvider.getGasPrice(StorageTypes.GasPriceType.SAFELOW),
      ).resolves.toEqual(BigNumber.from(1000000000));

      await expect(
        ethGasStationProvider.getGasPrice(StorageTypes.GasPriceType.STANDARD),
      ).resolves.toEqual(BigNumber.from(3050000000));

      await expect(
        ethGasStationProvider.getGasPrice(StorageTypes.GasPriceType.FAST),
      ).resolves.toEqual(BigNumber.from(7000000000));
    });

    it('throws when API is not available', async () => {
      jest.spyOn(Axios, 'get').mockResolvedValue({ status: 400 });

      await expect(
        ethGasStationProvider.getGasPrice(StorageTypes.GasPriceType.STANDARD),
      ).rejects.toThrowError(
        `EthGasStation error 400. Bad response from server ${ethGasStationProvider.providerUrl}`,
      );
    });

    it('throws when API returns a response with the incorrect format', async () => {
      jest
        .spyOn(Axios, 'get')
        .mockResolvedValueOnce({ status: 200, data: apiIncorrectResponse })
        .mockResolvedValueOnce({ status: 200, data: apiUncompleteResponse })
        .mockResolvedValueOnce({ status: 200, data: apiNotANumber });

      // When format is incorrect
      await expect(
        ethGasStationProvider.getGasPrice(StorageTypes.GasPriceType.STANDARD),
      ).rejects.toThrowError(`EthGasStation API response doesn't contain the correct format`);

      // When a field is missing
      await expect(
        ethGasStationProvider.getGasPrice(StorageTypes.GasPriceType.STANDARD),
      ).rejects.toThrowError(`EthGasStation API response doesn't contain the correct format`);

      // When a field is not a number
      await expect(
        ethGasStationProvider.getGasPrice(StorageTypes.GasPriceType.STANDARD),
      ).rejects.toThrowError(`EthGasStation API response doesn't contain the correct format`);
    });

    it('throws when API returns a response with a gas price not safe to use', async () => {
      jest.spyOn(Axios, 'get').mockResolvedValue({ status: 200, data: apiNotSafeGasPriceResponse });

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
