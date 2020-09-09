import { PaymentTypes } from '@requestnetwork/types';

import ChainSo from '../../../src/btc/default-providers/chain-so';

import * as ChainSoData from './chain-so-data';

// Most of the tests are done as integration tests in ../index.test.ts
/* tslint:disable:no-unused-expression */
describe('api/btc/providers/chainSo', () => {
  describe('getAddressInfo', () => {
    it('must throw if bitcoinNetworkId is not 0 or 3', async () => {
      const chainSo = new ChainSo();
      await expect(
        chainSo.getAddressBalanceWithEvents(1, 'address', PaymentTypes.EVENTS_NAMES.PAYMENT),
      ).rejects.toThrowError(
        'Invalid network 0 (mainnet) or 3 (testnet) was expected but 1 was given',
      );
    });
  });

  describe('parse', () => {
    it('can parse data', () => {
      const chainSo = new ChainSo();
      const parsedData = chainSo.parse(
        ChainSoData.exampleAddressInfo,
        PaymentTypes.EVENTS_NAMES.PAYMENT,
      );
      // 'balance wrong'
      expect(parsedData.balance).toBe('50500000');
      // 'balance wrong'
      expect(parsedData.events).toEqual([
        {
          amount: '500000',
          name: 'payment',
          parameters: {
            block: 1354204,
            txHash: '2a14f1ad2dfa4601bdc7a6be325241bbdc2ae99d05f096357fda76264b1c5c26',
          },
          timestamp: 1531879904,
        },
        {
          amount: '50000000',
          name: 'payment',
          parameters: {
            block: 1354075,
            txHash: '7d84924c034798dedcc95f479c9cdb24fe014437f7ce0ee0c2f4bf3580e017d8',
          },
          timestamp: 1531817766,
        },
      ]);
    });
  });
});
