import { StorageTypes } from '@requestnetwork/types';
import EtherchainProvider from '../../src/gas-price-providers/etherchain-provider';

import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import * as fetchMock from 'fetch-mock';

const bigNumber: any = require('bn.js');

// Extends chai for promises
chai.use(chaiAsPromised);
const expect = chai.expect;

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
      ).to.eventually.eql(new bigNumber(1000000000));

      await expect(
        etherchainProvider.getGasPrice(StorageTypes.GasPriceType.STANDARD),
      ).to.eventually.eql(new bigNumber(3500000000));

      await expect(
        etherchainProvider.getGasPrice(StorageTypes.GasPriceType.FAST),
      ).to.eventually.eql(new bigNumber(7000000000));
    });

    it('throws when API is not available', async () => {
      const mock = fetchMock.sandbox().mock(etherchainProvider.providerUrl, 400);
      etherchainProvider.fetch = mock as any;

      await expect(
        etherchainProvider.getGasPrice(StorageTypes.GasPriceType.STANDARD),
      ).to.be.rejectedWith(
        `Etherchain error 400. Bad response from server ${etherchainProvider.providerUrl}`,
      );
    });

    it('throws when API returns a response with the incorrect format', async () => {
      let mock = fetchMock.sandbox().mock(etherchainProvider.providerUrl, apiIncorrectResponse);
      etherchainProvider.fetch = mock as any;

      // When format is incorrect
      await expect(
        etherchainProvider.getGasPrice(StorageTypes.GasPriceType.STANDARD),
      ).to.be.rejectedWith(`Etherchain API response doesn't contain the correct format`);

      mock = fetchMock.sandbox().mock(etherchainProvider.providerUrl, apiUncompleteResponse);
      etherchainProvider.fetch = mock as any;

      // When a field is missing
      await expect(
        etherchainProvider.getGasPrice(StorageTypes.GasPriceType.STANDARD),
      ).to.be.rejectedWith(`Etherchain API response doesn't contain the correct format`);

      mock = fetchMock.sandbox().mock(etherchainProvider.providerUrl, apiNotANumber);
      etherchainProvider.fetch = mock as any;

      // When a field is not a number
      await expect(
        etherchainProvider.getGasPrice(StorageTypes.GasPriceType.STANDARD),
      ).to.be.rejectedWith(`Etherchain API response doesn't contain the correct format`);
    });

    it('throws when API returns a response with a gas price not safe to use', async () => {
      const mock = fetchMock
        .sandbox()
        .mock(etherchainProvider.providerUrl, apiNotSafeGasPriceResponse);
      etherchainProvider.fetch = mock as any;

      // When over the limit
      await expect(
        etherchainProvider.getGasPrice(StorageTypes.GasPriceType.STANDARD),
      ).to.be.rejectedWith(`Etherchain provided gas price not safe to use`);

      // When 0
      await expect(
        etherchainProvider.getGasPrice(StorageTypes.GasPriceType.FAST),
      ).to.be.rejectedWith(`Etherchain provided gas price not safe to use`);
    });
  });
});
