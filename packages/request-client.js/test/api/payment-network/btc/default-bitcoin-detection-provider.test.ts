import 'mocha';

const chai = require('chai');
const spies = require('chai-spies');
const chaiAsPromised = require('chai-as-promised');
const expect = chai.expect;
chai.use(spies);
chai.use(chaiAsPromised);

import * as Types from '../../../../src/types';

import DefaultBitcoinDetectionProvider from '../../../../src/api/payment-network/btc/default-bitcoin-detection-provider';

const btcProviderMock0: Types.IBitcoinDetectionProvider = {
  getAddressBalanceWithEvents: async (): Promise<Types.IBalanceWithEvents> => ({
    balance: '0',
    events: [],
  }),
};

const btcProviderMock1: Types.IBitcoinDetectionProvider = {
  getAddressBalanceWithEvents: async (): Promise<Types.IBalanceWithEvents> => ({
    balance: '1',
    events: [],
  }),
};

const btcProviderMock2: Types.IBitcoinDetectionProvider = {
  getAddressBalanceWithEvents: async (): Promise<Types.IBalanceWithEvents> => ({
    balance: '2',
    events: [],
  }),
};

const btcProviderMockMinus1: Types.IBitcoinDetectionProvider = {
  getAddressBalanceWithEvents: async (): Promise<Types.IBalanceWithEvents> => ({
    balance: '-1',
    events: [],
  }),
};

// Most of the tests are done as integration tests in ../index.test.ts
/* tslint:disable:no-unused-expression */
describe('api/btc/bitcoin-info-retriever', () => {
  describe('getAddressBalanceWithEvents', () => {
    it('should give the right value with two identical response', async () => {
      const btcRetriever = new DefaultBitcoinDetectionProvider();
      btcRetriever.providers = [btcProviderMock1, btcProviderMock1];

      await expect(
        btcRetriever.getAddressBalanceWithEvents(0, 'address', Types.EVENTS_NAMES.PAYMENT),
      ).to.eventually.be.deep.equal({ balance: '1', events: [] });
    });

    it('should give the right value with two identical responses and one fail', async () => {
      const btcRetriever = new DefaultBitcoinDetectionProvider();

      btcRetriever.providers = [btcProviderMockMinus1, btcProviderMock1, btcProviderMock1];
      await expect(
        btcRetriever.getAddressBalanceWithEvents(0, 'address', Types.EVENTS_NAMES.PAYMENT),
      ).to.eventually.be.deep.equal({ balance: '1', events: [] });

      btcRetriever.providers = [btcProviderMock1, btcProviderMockMinus1, btcProviderMock1];
      await expect(
        btcRetriever.getAddressBalanceWithEvents(0, 'address', Types.EVENTS_NAMES.PAYMENT),
      ).to.eventually.be.deep.equal({ balance: '1', events: [] });
    });

    it('should give the right value with two identical responses and one different', async () => {
      const btcRetriever = new DefaultBitcoinDetectionProvider();

      btcRetriever.providers = [btcProviderMock0, btcProviderMock1, btcProviderMock1];
      await expect(
        btcRetriever.getAddressBalanceWithEvents(0, 'address', Types.EVENTS_NAMES.PAYMENT),
      ).to.eventually.be.deep.equal({ balance: '1', events: [] });

      btcRetriever.providers = [btcProviderMock1, btcProviderMock0, btcProviderMock1];
      await expect(
        btcRetriever.getAddressBalanceWithEvents(0, 'address', Types.EVENTS_NAMES.PAYMENT),
      ).to.eventually.be.deep.equal({ balance: '1', events: [] });
    });

    it('should give the right value with two identical responses and two different', async () => {
      const btcRetriever = new DefaultBitcoinDetectionProvider();

      btcRetriever.providers = [
        btcProviderMock0,
        btcProviderMock1,
        btcProviderMock2,
        btcProviderMock1,
      ];
      await expect(
        btcRetriever.getAddressBalanceWithEvents(0, 'address', Types.EVENTS_NAMES.PAYMENT),
      ).to.eventually.be.deep.equal({ balance: '1', events: [] });

      btcRetriever.providers = [
        btcProviderMock2,
        btcProviderMock0,
        btcProviderMock1,
        btcProviderMock1,
      ];
      await expect(
        btcRetriever.getAddressBalanceWithEvents(0, 'address', Types.EVENTS_NAMES.PAYMENT),
      ).to.eventually.be.deep.equal({ balance: '1', events: [] });

      btcRetriever.providers = [
        btcProviderMock0,
        btcProviderMock2,
        btcProviderMock1,
        btcProviderMock1,
      ];
      await expect(
        btcRetriever.getAddressBalanceWithEvents(0, 'address', Types.EVENTS_NAMES.PAYMENT),
      ).to.eventually.be.deep.equal({ balance: '1', events: [] });

      btcRetriever.providers = [
        btcProviderMock1,
        btcProviderMock0,
        btcProviderMock2,
        btcProviderMock1,
      ];
      await expect(
        btcRetriever.getAddressBalanceWithEvents(0, 'address', Types.EVENTS_NAMES.PAYMENT),
      ).to.eventually.be.deep.equal({ balance: '1', events: [] });
    });

    it('should give the right value with two identical responses and two failed', async () => {
      const btcRetriever = new DefaultBitcoinDetectionProvider();

      btcRetriever.providers = [
        btcProviderMockMinus1,
        btcProviderMock1,
        btcProviderMockMinus1,
        btcProviderMock1,
      ];
      await expect(
        btcRetriever.getAddressBalanceWithEvents(0, 'address', Types.EVENTS_NAMES.PAYMENT),
      ).to.eventually.be.deep.equal({ balance: '1', events: [] });

      btcRetriever.providers = [
        btcProviderMockMinus1,
        btcProviderMockMinus1,
        btcProviderMock1,
        btcProviderMock1,
      ];
      await expect(
        btcRetriever.getAddressBalanceWithEvents(0, 'address', Types.EVENTS_NAMES.PAYMENT),
      ).to.eventually.be.deep.equal({ balance: '1', events: [] });

      btcRetriever.providers = [
        btcProviderMock1,
        btcProviderMockMinus1,
        btcProviderMockMinus1,
        btcProviderMock1,
      ];
      await expect(
        btcRetriever.getAddressBalanceWithEvents(0, 'address', Types.EVENTS_NAMES.PAYMENT),
      ).to.eventually.be.deep.equal({ balance: '1', events: [] });
    });

    it('should throw with two failed', async () => {
      const btcRetriever = new DefaultBitcoinDetectionProvider();
      btcRetriever.providers = [btcProviderMockMinus1, btcProviderMockMinus1];

      await expect(
        btcRetriever.getAddressBalanceWithEvents(0, 'address', Types.EVENTS_NAMES.PAYMENT),
      ).to.eventually.rejectedWith('Error getting the balance from the bitcoin providers');
    });

    it('should throw with two different response', async () => {
      const btcRetriever = new DefaultBitcoinDetectionProvider();
      btcRetriever.providers = [btcProviderMock1, btcProviderMock0];

      await expect(
        btcRetriever.getAddressBalanceWithEvents(0, 'address', Types.EVENTS_NAMES.PAYMENT),
      ).to.eventually.rejectedWith('Error getting the balance from the bitcoin providers');
    });

    it('should throw with three different response', async () => {
      const btcRetriever = new DefaultBitcoinDetectionProvider();
      btcRetriever.providers = [btcProviderMock1, btcProviderMock2, btcProviderMock0];

      await expect(
        btcRetriever.getAddressBalanceWithEvents(0, 'address', Types.EVENTS_NAMES.PAYMENT),
      ).to.eventually.rejectedWith('Error getting the balance from the bitcoin providers');
    });

    it('should throw with three failed', async () => {
      const btcRetriever = new DefaultBitcoinDetectionProvider();
      btcRetriever.providers = [
        btcProviderMockMinus1,
        btcProviderMockMinus1,
        btcProviderMockMinus1,
      ];

      await expect(
        btcRetriever.getAddressBalanceWithEvents(0, 'address', Types.EVENTS_NAMES.PAYMENT),
      ).to.eventually.rejectedWith('Error getting the balance from the bitcoin providers');
    });
  });
});
