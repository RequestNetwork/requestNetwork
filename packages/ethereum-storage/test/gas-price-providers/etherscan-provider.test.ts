import { StorageTypes } from '@requestnetwork/types';
import EtherscanProvider from '../../src/gas-price-providers/etherscan-provider';

import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import * as fetchMock from 'fetch-mock';

const bigNumber: any = require('bn.js');

// Extends chai for promises
chai.use(chaiAsPromised);
const expect = chai.expect;

let etherscanProvider: EtherscanProvider;

const apiCorrectResponse = {
  FastGasPrice: '7.0',
  ProposeGasPrice: '3.5',
  SafeGasPrice: '1.0',
};

const apiIncorrectResponse = {
  incorrect: 'response',
};

const apiIncompleteResponse = {
  FastGasPrice: '7.0',
  SafeGasPrice: '1.0',
};

const apiNotANumber = {
  FastGasPrice: '7.0',
  ProposeGasPrice: 'not a number',
  SafeGasPrice: '1.0',
};

const apiNotSafeGasPriceResponse = {
  FastGasPrice: '0',
  ProposeGasPrice: '10000',
  SafeGasPrice: '1.0',
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
      expect(
        await etherscanProvider.getGasPrice(StorageTypes.GasPriceType.SAFELOW),
      ).to.eventually.eql(new bigNumber(1000000000));

      expect(
        await etherscanProvider.getGasPrice(StorageTypes.GasPriceType.STANDARD),
      ).to.eventually.eql(new bigNumber(3500000000));

      expect(await etherscanProvider.getGasPrice(StorageTypes.GasPriceType.FAST)).to.eventually.eql(
        new bigNumber(7000000000),
      );
    });

    it('throws when API is not available', async () => {
      const mock = fetchMock.sandbox().mock(etherscanProvider.providerUrl, 400);
      etherscanProvider.fetch = mock as any;

      expect(
        await etherscanProvider.getGasPrice(StorageTypes.GasPriceType.STANDARD),
      ).to.be.rejectedWith(
        `Etherscan error 400. Bad response from server ${etherscanProvider.providerUrl}`,
      );
    });

    it('throws when API returns a response with the incorrect format', async () => {
      let mock = fetchMock.sandbox().mock(etherscanProvider.providerUrl, apiIncorrectResponse);
      etherscanProvider.fetch = mock as any;

      // When format is incorrect
      expect(
        await etherscanProvider.getGasPrice(StorageTypes.GasPriceType.STANDARD),
      ).to.be.rejectedWith(`Etherscan API response doesn't contain the correct format`);

      mock = fetchMock.sandbox().mock(etherscanProvider.providerUrl, apiIncompleteResponse);
      etherscanProvider.fetch = mock as any;

      // When a field is missing
      expect(
        await etherscanProvider.getGasPrice(StorageTypes.GasPriceType.STANDARD),
      ).to.be.rejectedWith(`Etherscan API response doesn't contain the correct format`);

      mock = fetchMock.sandbox().mock(etherscanProvider.providerUrl, apiNotANumber);
      etherscanProvider.fetch = mock as any;

      // When a field is not a number
      expect(
        await etherscanProvider.getGasPrice(StorageTypes.GasPriceType.STANDARD),
      ).to.be.rejectedWith(`Etherscan API response doesn't contain the correct format`);

      mock = fetchMock.sandbox().mock(etherscanProvider.providerUrl, apiRateLimitResponse);
      etherscanProvider.fetch = mock as any;

      // When status is not 1
      expect(
        await etherscanProvider.getGasPrice(StorageTypes.GasPriceType.STANDARD),
      ).to.be.rejectedWith(
        `Etherscan error: NOTOK Max rate limit reached, please use API Key for higher rate limit`,
      );
    });

    it('throws when API returns a response with a gas price not safe to use', async () => {
      const mock = fetchMock
        .sandbox()
        .mock(etherscanProvider.providerUrl, apiNotSafeGasPriceResponse);
      etherscanProvider.fetch = mock as any;

      // When over the limit
      expect(
        await etherscanProvider.getGasPrice(StorageTypes.GasPriceType.STANDARD),
      ).to.be.rejectedWith(`Etherscan provided gas price not safe to use`);

      // When 0
      expect(
        await etherscanProvider.getGasPrice(StorageTypes.GasPriceType.FAST),
      ).to.be.rejectedWith(`Etherscan provided gas price not safe to use`);
    });
  });
});
