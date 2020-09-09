import MultiFormat from '@requestnetwork/multi-format';
import Utils from '@requestnetwork/utils';
import ClearTransaction from '../../src/clear-transaction';

const data = '{ "what": "ever", "it": "is,", "this": "must", "work": true }';

/* tslint:disable:no-unused-expression */
describe('clear-transaction', () => {
  describe('getData', () => {
    it('can getData()', async () => {
      const tx = new ClearTransaction(data);

      // 'transaction not right'
      expect(await tx.getData()).toEqual(data);
    });
  });

  describe('getHash', () => {
    it('can get hash of the data', async () => {
      const tx = new ClearTransaction(data);

      // 'hash not right'
      expect(await tx.getHash()).toEqual(
        MultiFormat.serialize(Utils.crypto.normalizeKeccak256Hash(JSON.parse(data))),
      );
    });
  });

  describe('getError', () => {
    it('can get error of a transaction', async () => {
      const tx = new ClearTransaction('Not parsable');

      // 'error not right'
      expect(await tx.getError()).toEqual('Impossible to JSON parse the transaction');
    });
    it('can get error of a transaction if no error', async () => {
      const tx = new ClearTransaction(data);

      // 'error not right'
      expect(await tx.getError()).toEqual('');
    });
  });
});
