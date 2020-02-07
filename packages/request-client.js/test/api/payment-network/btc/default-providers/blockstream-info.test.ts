import { PaymentTypes } from '@requestnetwork/types';
import Blockstream from '../../../../../src/api/payment-network/btc/default-providers/blockstream-info';

import * as BlockstreamData from './blockstream-info-data';

import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';

chai.use(chaiAsPromised);
const expect = chai.expect;

import 'mocha';

// Most of the tests are done as integration tests in ../index.test.ts
/* tslint:disable:no-unused-expression */
describe('api/btc/providers/blockstream', () => {
  describe('getAddressInfo', () => {
    it('must throw if bitcoinNetworkId is not 0 or 3', async () => {
      const blockstreamData = new Blockstream();
      expect(
        blockstreamData.getAddressBalanceWithEvents(
          1,
          'address',
          PaymentTypes.EVENTS_NAMES.PAYMENT,
        ),
      ).to.eventually.be.rejectedWith(
        'Invalid network 0 (mainnet) or 3 (testnet) was expected but 1 was given',
      );
    });
  });

  describe('parse', () => {
    it('can parse data', () => {
      const blockstreamData = new Blockstream();
      const parsedData = blockstreamData.parse(
        { txs: BlockstreamData.exampleAddressInfo, address: 'mgPKDuVmuS9oeE2D9VPiCQriyU14wxWS1v' },
        PaymentTypes.EVENTS_NAMES.PAYMENT,
      );
      expect(parsedData.balance, 'balance wrong').to.equal('50500000');

      expect(parsedData.events, 'events wrong').to.deep.equal([
        {
          amount: '500000',
          name: 'payment',
          parameters: {
            block: 1354204,
            txHash: '2a14f1ad2dfa4601bdc7a6be325241bbdc2ae99d05f096357fda76264b1c5c26',
          },
          timestamp: 1531880048,
        },
        {
          amount: '50000000',
          name: 'payment',
          parameters: {
            block: 1354075,
            txHash: '7d84924c034798dedcc95f479c9cdb24fe014437f7ce0ee0c2f4bf3580e017d8',
          },
          timestamp: 1531818367,
        },
      ]);
    });
  });
});
