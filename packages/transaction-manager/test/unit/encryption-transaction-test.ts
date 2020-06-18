import * as chai from 'chai';
import 'mocha';

const chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);
const expect = chai.expect;

import MultiFormat from '@requestnetwork/multi-format';
import { EncryptionTypes } from '@requestnetwork/types';
import Utils from '@requestnetwork/utils';

import EncryptedTransaction from '../../src/encrypted-transaction';

const data = '{ "what": "ever", "it": "is,", "this": "must", "work": true }';
const hash = MultiFormat.serialize(Utils.crypto.normalizeKeccak256Hash(JSON.parse(data)));
const channelKey = {
  key: 'XYVH7kMWMAy/if+IZ0e7EXMbPVptHd22Xmpr9ktmjRo=',
  method: EncryptionTypes.METHOD.AES256_CBC,
};
const encryptedData =
  '03QiFJRkpKMTTKl+e/xLzH51zkzYHGLVmrN584RhjA+pyFxEzJp1JVBOthL8mZAWv361mYOluCz2Y37G7EkGUb95dzQgLEzoEWAFCO6UipX5s=';

/* tslint:disable:no-unused-expression */
describe('encryption-transaction', () => {
  describe('getData', () => {
    it('can getData()', async () => {
      const tx = new EncryptedTransaction(encryptedData, channelKey);
      expect(await tx.getData(), 'transaction not right').to.deep.equal(data);
    });
  });

  describe('getHash', () => {
    it('can get hash of the data', async () => {
      const tx = new EncryptedTransaction(encryptedData, channelKey);

      expect(await tx.getHash(), 'hash not right').to.deep.equal(hash);
    });
  });

  describe('getError', () => {
    it('can get error of a transaction not parsable', async () => {
      const encryptedDataNotParsable = MultiFormat.serialize(
        await Utils.encryption.encrypt('Not parsable', channelKey),
      );

      const tx = new EncryptedTransaction(encryptedDataNotParsable, channelKey);

      expect(await tx.getError(), 'error not right').to.deep.equal(
        'Impossible to JSON parse the decrypted transaction data',
      );
    });
    it('can get error of a transaction impossible to decrypt', async () => {
      const tx = new EncryptedTransaction(encryptedData, {
        key: 'Corrupted',
        method: EncryptionTypes.METHOD.AES256_CBC,
      });

      expect(await tx.getError(), 'error not right').to.deep.equal(
        'Impossible to decrypt the transaction',
      );
    });
    it('can get error of a transaction if no error', async () => {
      const tx = new EncryptedTransaction(encryptedData, channelKey);
      expect(await tx.getError(), 'error not right').to.deep.equal('');
    });
  });
});
