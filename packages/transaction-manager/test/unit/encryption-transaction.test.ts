/* eslint-disable spellcheck/spell-checker */
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
      // 'transaction not right'
      expect(await tx.getData()).toEqual(data);
    });
  });

  describe('getHash', () => {
    it('can get hash of the data', async () => {
      const tx = new EncryptedTransaction(encryptedData, channelKey);

      // 'hash not right'
      expect(await tx.getHash()).toEqual(hash);
    });
  });

  describe('getError', () => {
    it('can get error of a transaction not parsable', async () => {
      const encryptedDataNotParsable = MultiFormat.serialize(
        await Utils.encryption.encrypt('Not parsable', channelKey),
      );

      const tx = new EncryptedTransaction(encryptedDataNotParsable, channelKey);

      // 'error not right'
      expect(await tx.getError()).toEqual(
        'Impossible to JSON parse the decrypted transaction data',
      );
    });
    it('can get error of a transaction impossible to decrypt', async () => {
      const tx = new EncryptedTransaction(encryptedData, {
        key: 'Corrupted',
        method: EncryptionTypes.METHOD.AES256_CBC,
      });

      // 'error not right'
      expect(await tx.getError()).toEqual('Impossible to decrypt the transaction');
    });
    it('can get error of a transaction if no error', async () => {
      const tx = new EncryptedTransaction(encryptedData, channelKey);
      // 'error not right'
      expect(await tx.getError()).toEqual('');
    });
  });
});
