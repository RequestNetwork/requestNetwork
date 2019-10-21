import * as chai from 'chai';
import 'mocha';

const chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);
const expect = chai.expect;

import MultiFormat from '@requestnetwork/multi-format';
import Utils from '@requestnetwork/utils';
import ClearTransaction from '../../src/clear-transaction';

const data = '{ "what": "ever", "it": "is,", "this": "must", "work": true }';

/* tslint:disable:no-unused-expression */
describe('clear-transaction', () => {
  describe('getData', () => {
    it('can getData()', async () => {
      const tx = new ClearTransaction(data);

      expect(await tx.getData(), 'transaction not right').to.deep.equal(data);
    });
  });

  describe('getHash', () => {
    it('can get hash of the data', async () => {
      const tx = new ClearTransaction(data);

      expect(await tx.getHash(), 'hash not right').to.deep.equal(
        MultiFormat.serialize(Utils.crypto.normalizeKeccak256Hash(JSON.parse(data))),
      );
    });
  });

  describe('getError', () => {
    it('can get error of a transaction', async () => {
      const tx = new ClearTransaction('Not parsable');

      expect(await tx.getError(), 'error not right').to.deep.equal(
        'Impossible to JSON parse the transaction',
      );
    });
    it('can get error of a transaction if no error', async () => {
      const tx = new ClearTransaction(data);

      expect(await tx.getError(), 'error not right').to.deep.equal('');
    });
  });
});
