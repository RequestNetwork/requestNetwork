import * as Types from '../../../../../src/types';

import BlockchainInfo from '../../../../../src/api/payment-network/btc/default-providers/blockchain-info';

import * as BlockchainInfoData from './blockchain-info-data';

import { expect } from 'chai';
import 'mocha';

// Most of the tests are done as integration tests in ../index.test.ts
/* tslint:disable:no-unused-expression */
describe('api/btc/default-providers/blockchainInfo', () => {
  describe('getAddressInfo', () => {
    it('must throw if bitcoinNetworkId is not 0 or 3', async () => {
      const blockchainInfo = new BlockchainInfo();
      try {
        await blockchainInfo.getAddressBalanceWithEvents(1, 'address', Types.EVENTS_NAMES.PAYMENT);
        expect(false, 'should throw').to.be.true;
      } catch (e) {
        expect(e.message).to.equal(
          'Invalid network 0 (mainnet) or 3 (testnet) was expected but 1 was given',
        );
      }
    });
  });

  describe('parse', () => {
    it('can parse data', () => {
      const blockchainInfo = new BlockchainInfo();

      const parsedData = blockchainInfo.parse(
        BlockchainInfoData.exampleAddressInfo,
        Types.EVENTS_NAMES.PAYMENT,
      );
      expect(parsedData.balance, 'balance wrong').to.equal('50500000');
      expect(parsedData.events, 'balance wrong').to.deep.equal([
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
