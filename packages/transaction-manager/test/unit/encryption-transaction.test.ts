import MultiFormat from '@requestnetwork/multi-format';
import { EncryptionTypes } from '@requestnetwork/types';

import EncryptedTransaction from '../../src/encrypted-transaction';
import { encrypt, normalizeKeccak256Hash } from '@requestnetwork/utils';

const data = '{ "what": "ever", "it": "is,", "this": "must", "work": true }';
const hash = MultiFormat.serialize(normalizeKeccak256Hash(JSON.parse(data)));
const channelKey = {
  key: 'XYVH7kMWMAy/if+IZ0e7EXMbPVptHd22Xmpr9ktmjRo=',
  method: EncryptionTypes.METHOD.AES256_CBC,
};
const encryptedData =
  '03QiFJRkpKMTTKl+e/xLzH51zkzYHGLVmrN584RhjA+pyFxEzJp1JVBOthL8mZAWv361mYOluCz2Y37G7EkGUb95dzQgLEzoEWAFCO6UipX5s=';

/* eslint-disable @typescript-eslint/no-unused-expressions */
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
        await encrypt('Not parsable', channelKey),
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
