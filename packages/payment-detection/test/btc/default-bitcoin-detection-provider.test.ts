import { PaymentTypes } from '@requestnetwork/types';

import DefaultBitcoinDetectionProvider from '../../src/btc/default-bitcoin-detection-provider';

const btcProviderMock0: PaymentTypes.IBitcoinDetectionProvider = {
  getAddressBalanceWithEvents: async (): Promise<PaymentTypes.BTCBalanceWithEvents> => ({
    balance: '0',
    events: [],
  }),
};

const btcProviderMock1: PaymentTypes.IBitcoinDetectionProvider = {
  getAddressBalanceWithEvents: async (): Promise<PaymentTypes.BTCBalanceWithEvents> => ({
    balance: '1',
    events: [],
  }),
};

const btcProviderMock2: PaymentTypes.IBitcoinDetectionProvider = {
  getAddressBalanceWithEvents: async (): Promise<PaymentTypes.BTCBalanceWithEvents> => ({
    balance: '2',
    events: [],
  }),
};

const btcProviderMockMinus1: PaymentTypes.IBitcoinDetectionProvider = {
  getAddressBalanceWithEvents: async (): Promise<PaymentTypes.BTCBalanceWithEvents> => ({
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
        btcRetriever.getAddressBalanceWithEvents(0, 'address', PaymentTypes.EVENTS_NAMES.PAYMENT),
      ).resolves.toMatchObject({ balance: '1', events: [] });
    });

    it('should give the right value with two identical responses and one fail', async () => {
      const btcRetriever = new DefaultBitcoinDetectionProvider();

      btcRetriever.providers = [btcProviderMockMinus1, btcProviderMock1, btcProviderMock1];
      await expect(
        btcRetriever.getAddressBalanceWithEvents(0, 'address', PaymentTypes.EVENTS_NAMES.PAYMENT),
      ).resolves.toMatchObject({ balance: '1', events: [] });

      btcRetriever.providers = [btcProviderMock1, btcProviderMockMinus1, btcProviderMock1];
      await expect(
        btcRetriever.getAddressBalanceWithEvents(0, 'address', PaymentTypes.EVENTS_NAMES.PAYMENT),
      ).resolves.toMatchObject({ balance: '1', events: [] });
    });

    it('should give the right value with two identical responses and one different', async () => {
      const btcRetriever = new DefaultBitcoinDetectionProvider();

      btcRetriever.providers = [btcProviderMock0, btcProviderMock1, btcProviderMock1];
      await expect(
        btcRetriever.getAddressBalanceWithEvents(0, 'address', PaymentTypes.EVENTS_NAMES.PAYMENT),
      ).resolves.toMatchObject({ balance: '1', events: [] });

      btcRetriever.providers = [btcProviderMock1, btcProviderMock0, btcProviderMock1];
      await expect(
        btcRetriever.getAddressBalanceWithEvents(0, 'address', PaymentTypes.EVENTS_NAMES.PAYMENT),
      ).resolves.toMatchObject({ balance: '1', events: [] });
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
        btcRetriever.getAddressBalanceWithEvents(0, 'address', PaymentTypes.EVENTS_NAMES.PAYMENT),
      ).resolves.toMatchObject({ balance: '1', events: [] });

      btcRetriever.providers = [
        btcProviderMock2,
        btcProviderMock0,
        btcProviderMock1,
        btcProviderMock1,
      ];
      await expect(
        btcRetriever.getAddressBalanceWithEvents(0, 'address', PaymentTypes.EVENTS_NAMES.PAYMENT),
      ).resolves.toMatchObject({ balance: '1', events: [] });

      btcRetriever.providers = [
        btcProviderMock0,
        btcProviderMock2,
        btcProviderMock1,
        btcProviderMock1,
      ];
      await expect(
        btcRetriever.getAddressBalanceWithEvents(0, 'address', PaymentTypes.EVENTS_NAMES.PAYMENT),
      ).resolves.toMatchObject({ balance: '1', events: [] });

      btcRetriever.providers = [
        btcProviderMock1,
        btcProviderMock0,
        btcProviderMock2,
        btcProviderMock1,
      ];
      await expect(
        btcRetriever.getAddressBalanceWithEvents(0, 'address', PaymentTypes.EVENTS_NAMES.PAYMENT),
      ).resolves.toMatchObject({ balance: '1', events: [] });
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
        btcRetriever.getAddressBalanceWithEvents(0, 'address', PaymentTypes.EVENTS_NAMES.PAYMENT),
      ).resolves.toMatchObject({ balance: '1', events: [] });

      btcRetriever.providers = [
        btcProviderMockMinus1,
        btcProviderMockMinus1,
        btcProviderMock1,
        btcProviderMock1,
      ];
      await expect(
        btcRetriever.getAddressBalanceWithEvents(0, 'address', PaymentTypes.EVENTS_NAMES.PAYMENT),
      ).resolves.toMatchObject({ balance: '1', events: [] });

      btcRetriever.providers = [
        btcProviderMock1,
        btcProviderMockMinus1,
        btcProviderMockMinus1,
        btcProviderMock1,
      ];
      await expect(
        btcRetriever.getAddressBalanceWithEvents(0, 'address', PaymentTypes.EVENTS_NAMES.PAYMENT),
      ).resolves.toMatchObject({ balance: '1', events: [] });
    });

    it('should throw with two failed', async () => {
      const btcRetriever = new DefaultBitcoinDetectionProvider();
      btcRetriever.providers = [btcProviderMockMinus1, btcProviderMockMinus1];

      await expect(
        btcRetriever.getAddressBalanceWithEvents(0, 'address', PaymentTypes.EVENTS_NAMES.PAYMENT),
      ).rejects.toThrowError('Error getting the balance from the bitcoin providers');
    });

    it('should throw with two different response', async () => {
      const btcRetriever = new DefaultBitcoinDetectionProvider();
      btcRetriever.providers = [btcProviderMock1, btcProviderMock0];

      await expect(
        btcRetriever.getAddressBalanceWithEvents(0, 'address', PaymentTypes.EVENTS_NAMES.PAYMENT),
      ).rejects.toThrowError('Error getting the balance from the bitcoin providers');
    });

    it('should throw with three different response', async () => {
      const btcRetriever = new DefaultBitcoinDetectionProvider();
      btcRetriever.providers = [btcProviderMock1, btcProviderMock2, btcProviderMock0];

      await expect(
        btcRetriever.getAddressBalanceWithEvents(0, 'address', PaymentTypes.EVENTS_NAMES.PAYMENT),
      ).rejects.toThrowError('Error getting the balance from the bitcoin providers');
    });

    it('should throw with three failed', async () => {
      const btcRetriever = new DefaultBitcoinDetectionProvider();
      btcRetriever.providers = [
        btcProviderMockMinus1,
        btcProviderMockMinus1,
        btcProviderMockMinus1,
      ];

      await expect(
        btcRetriever.getAddressBalanceWithEvents(0, 'address', PaymentTypes.EVENTS_NAMES.PAYMENT),
      ).rejects.toThrowError('Error getting the balance from the bitcoin providers');
    });
  });
});
