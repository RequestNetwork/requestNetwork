import * as MultiFormat from '@requestnetwork/multi-format';
import { EncryptionTypes, MultiFormatTypes } from '@requestnetwork/types';
import TransactionsFactory from '../../src/transactions-factory';
import * as TestData from './utils/test-data';

const data = '{ "what": "ever", "it": "is,", "this": "must", "work": true }';
jest.setTimeout(20000); // in milliseconds

/* eslint-disable @typescript-eslint/no-unused-expressions */
describe('transaction-factory', () => {
  describe('createClearTransaction', () => {
    it('can create clear transaction', async () => {
      const tx = await TransactionsFactory.createClearTransaction(data);

      // 'transaction not right'
      expect(tx).toEqual({ data });
    });
    it('cannot create clear transaction with not parsable data', async () => {
      await expect(TransactionsFactory.createClearTransaction('Not parsable')).rejects.toThrowError(
        'Data not parsable',
      );
    });
  });

  describe('createEncryptedTransactionInNewChannel', () => {
    it('can create encrypted transaction', async () => {
      const encryptedTx = await TransactionsFactory.createEncryptedTransactionInNewChannel(data, [
        TestData.idRaw1.encryptionParams,
        TestData.idRaw2.encryptionParams,
        TestData.idRaw3.encryptionParams,
      ]);
      // eslint-disable-next-line no-magic-numbers

      if (encryptedTx.encryptedData) {
        // eslint-disable-next-line no-magic-numbers
        // 'encryptedData not right'
        expect(encryptedTx.encryptedData.length).toBe(126);
        // 'encryptedData not right'
        expect(encryptedTx.encryptedData.slice(0, 2)).toEqual(
          MultiFormatTypes.prefix.AES256_GCM_ENCRYPTED,
        );
      } else {
        fail('encryptedData should not be undefined');
      }

      // 'encryptionMethod not right'
      expect(encryptedTx.encryptionMethod).toEqual(
        `${EncryptionTypes.METHOD.ECIES}-${EncryptionTypes.METHOD.AES256_GCM}`,
      );

      // 'keys not right'
      expect(Object.keys(encryptedTx.keys || {}).length).toEqual(3);
      // 'keys not right'
      expect(Object.keys(encryptedTx.keys || {})).toEqual([
        MultiFormat.serialize(TestData.idRaw1.identity),
        MultiFormat.serialize(TestData.idRaw2.identity),
        MultiFormat.serialize(TestData.idRaw3.identity),
      ]);

      // 'encrypted keys looks wrong'
      expect(
        // eslint-disable-next-line no-magic-numbers
        Object.values(encryptedTx.keys || {}).every((ek) => ek.length === 260),
      ).toBe(true);
      // 'encrypted keys looks wrong'
      expect(
        Object.values(encryptedTx.keys || {}).every(
          (ek) => ek.slice(0, 2) === MultiFormatTypes.prefix.ECIES_ENCRYPTED,
        ),
      ).toBe(true);
    }, 10000);

    it('can create encrypted transaction with EthereumPrivateKeyCipherProvider', async () => {
      const encryptedTx = await TransactionsFactory.createEncryptedTransactionInNewChannel(
        data,
        [
          TestData.idRaw1.encryptionParams,
          TestData.idRaw2.encryptionParams,
          TestData.idRaw3.encryptionParams,
        ],
        TestData.fakeEpkCipherProvider,
      );
      // eslint-disable-next-line no-magic-numbers

      if (encryptedTx.encryptedData) {
        // eslint-disable-next-line no-magic-numbers
        // 'encryptedData not right'
        expect(encryptedTx.encryptedData.length).toBe(126);
        // 'encryptedData not right'
        expect(encryptedTx.encryptedData.slice(0, 2)).toEqual(
          MultiFormatTypes.prefix.AES256_GCM_ENCRYPTED,
        );
      } else {
        fail('encryptedData should not be undefined');
      }

      // 'encryptionMethod not right'
      expect(encryptedTx.encryptionMethod).toEqual(
        `${EncryptionTypes.METHOD.ECIES}-${EncryptionTypes.METHOD.AES256_GCM}`,
      );

      // 'keys not right'
      expect(Object.keys(encryptedTx.keys || {}).length).toEqual(3);
      // 'keys not right'
      expect(Object.keys(encryptedTx.keys || {})).toEqual([
        MultiFormat.serialize(TestData.idRaw1.identity),
        MultiFormat.serialize(TestData.idRaw2.identity),
        MultiFormat.serialize(TestData.idRaw3.identity),
      ]);

      // 'encrypted keys looks wrong'
      expect(
        // eslint-disable-next-line no-magic-numbers
        Object.values(encryptedTx.keys || {}).every((ek) => ek.length === 260),
      ).toBe(true);
      // 'encrypted keys looks wrong'
      expect(
        Object.values(encryptedTx.keys || {}).every(
          (ek) => ek.slice(0, 2) === MultiFormatTypes.prefix.ECIES_ENCRYPTED,
        ),
      ).toBe(true);
    }, 10000);

    it('can create encrypted transaction with Lit Protocol', async () => {
      const encryptedTx = await TransactionsFactory.createEncryptedTransactionInNewChannel(
        data,
        [
          TestData.kmsRaw1.encryptionParams,
          TestData.kmsRaw2.encryptionParams,
          TestData.kmsRaw3.encryptionParams,
        ],
        TestData.fakeLitProtocolCipherProvider,
      );
      // eslint-disable-next-line no-magic-numbers

      if (encryptedTx.encryptedData) {
        // eslint-disable-next-line no-magic-numbers
        expect(encryptedTx.encryptedData.length).toBe(126);
        expect(encryptedTx.encryptedData.slice(0, 2)).toEqual(
          MultiFormatTypes.prefix.AES256_GCM_ENCRYPTED,
        );
      } else {
        fail('encryptedData should not be undefined');
      }

      expect(encryptedTx.encryptionMethod).toEqual(
        `${EncryptionTypes.METHOD.KMS}-${EncryptionTypes.METHOD.AES256_GCM}`,
      );

      expect(Object.keys(encryptedTx.keys || {}).length).toEqual(3);

      expect(Object.keys(encryptedTx.keys || {})).toEqual([
        TestData.kmsRaw1.encryptionParams.key,
        TestData.kmsRaw2.encryptionParams.key,
        TestData.kmsRaw3.encryptionParams.key,
      ]);

      expect(
        Object.values(encryptedTx.keys || {}).every(
          (ek) => ek.slice(0, 2) === MultiFormatTypes.prefix.KMS_ENCRYPTED,
        ),
      ).toBe(true);
    });

    it('should throw error when cipherProvider is not provided for KMS encryption', async () => {
      await expect(
        TransactionsFactory.createEncryptedTransactionInNewChannel(
          data,
          [TestData.kmsRaw1.encryptionParams],
          undefined,
        ),
      ).rejects.toThrowError('cipherProvider is required for KMS encryption');
    });

    it('cannot create encrypted transaction with encryption parameters not ECIES', async () => {
      await expect(
        TransactionsFactory.createEncryptedTransactionInNewChannel(data, [
          TestData.idRaw1.encryptionParams,
          TestData.idRaw2.encryptionParams,
          { method: EncryptionTypes.METHOD.AES256_CBC, key: '0123456789' },
        ]),
      ).rejects.toThrowError(
        `encryptionParams method must be all: ${EncryptionTypes.METHOD.ECIES}`,
      );
    });

    it('cannot create encrypted transaction with not parsable data', async () => {
      await expect(
        TransactionsFactory.createEncryptedTransactionInNewChannel('Not parsable', [
          TestData.idRaw1.encryptionParams,
          TestData.idRaw2.encryptionParams,
        ]),
      ).rejects.toThrowError('Data not parsable');
    });
  });

  describe('createEncryptedTransaction', () => {
    it('can create encrypted transaction', async () => {
      const channelKey = {
        key: 'Vt6L0ppo7tOs9KdnTT6HSHZ/wW1Pfu/rgSs5NVTigN8=',
        method: EncryptionTypes.METHOD.AES256_GCM,
      };
      const encryptedTx = await TransactionsFactory.createEncryptedTransaction(data, channelKey);
      // eslint-disable-next-line no-magic-numbers

      if (encryptedTx.encryptedData) {
        // eslint-disable-next-line no-magic-numbers
        // 'encryptedData not right'
        expect(encryptedTx.encryptedData.length).toBe(126);
        // 'encryptedData not right'
        expect(encryptedTx.encryptedData.slice(0, 2)).toEqual(
          MultiFormatTypes.prefix.AES256_GCM_ENCRYPTED,
        );
      } else {
        fail('encryptedData should not be undefined');
      }

      // 'encryptionMethod not right'
      expect(encryptedTx.encryptionMethod).toBeUndefined();

      // 'keys not right'
      expect(encryptedTx.keys).toBeUndefined();
    }, 10000);

    it('can create encrypted transaction with Lit Protocol', async () => {
      const channelKey = {
        key: 'Vt6L0ppo7tOs9KdnTT6HSHZ/wW1Pfu/rgSs5NVTigN8=',
        method: EncryptionTypes.METHOD.AES256_GCM,
      };
      const encryptedTx = await TransactionsFactory.createEncryptedTransaction(
        data,
        channelKey,
        undefined,
        TestData.fakeLitProtocolCipherProvider,
      );
      // eslint-disable-next-line no-magic-numbers

      if (encryptedTx.encryptedData) {
        // eslint-disable-next-line no-magic-numbers
        // 'encryptedData not right'
        expect(encryptedTx.encryptedData.length).toBe(126);
        // 'encryptedData not right'
        expect(encryptedTx.encryptedData.slice(0, 2)).toEqual(
          MultiFormatTypes.prefix.AES256_GCM_ENCRYPTED,
        );
      } else {
        fail('encryptedData should not be undefined');
      }

      // 'encryptionMethod not right'
      expect(encryptedTx.encryptionMethod).toBeUndefined();

      // 'keys not right'
      expect(encryptedTx.keys).toBeUndefined();
    });

    it('can create encrypted transaction with Lit Protocol and encryption parameters', async () => {
      const channelKey = {
        key: 'Vt6L0ppo7tOs9KdnTT6HSHZ/wW1Pfu/rgSs5NVTigN8=',
        method: EncryptionTypes.METHOD.AES256_GCM,
      };
      const encryptedTx = await TransactionsFactory.createEncryptedTransaction(
        data,
        channelKey,
        [
          TestData.kmsRaw1.encryptionParams,
          TestData.kmsRaw2.encryptionParams,
          TestData.kmsRaw3.encryptionParams,
        ],
        TestData.fakeLitProtocolCipherProvider,
      );
      // eslint-disable-next-line no-magic-numbers

      if (encryptedTx.encryptedData) {
        // eslint-disable-next-line no-magic-numbers
        // 'encryptedData not right'
        expect(encryptedTx.encryptedData.length).toBe(126);
        // 'encryptedData not right'
        expect(encryptedTx.encryptedData.slice(0, 2)).toEqual(
          MultiFormatTypes.prefix.AES256_GCM_ENCRYPTED,
        );
      } else {
        fail('encryptedData should not be undefined');
      }

      expect(
        Object.values(encryptedTx.keys || {}).every(
          (ek) => ek.slice(0, 2) === MultiFormatTypes.prefix.KMS_ENCRYPTED,
        ),
      ).toBe(true);
    });

    it('cannot create encrypted transaction with encryption parameters not AES256-CBC', async () => {
      const channelKeyWrong = {
        key: 'Vt6L0ppo7tOs9KdnTT6HSHZ/wW1Pfu/rgSs5NVTigN8=',
        method: EncryptionTypes.METHOD.ECIES,
      };
      await expect(
        TransactionsFactory.createEncryptedTransaction(data, channelKeyWrong),
      ).rejects.toThrowError(
        `encryption method not supported for the channel key: ${channelKeyWrong.method}`,
      );
    });

    it('cannot create encrypted transaction with not parsable data', async () => {
      const channelKey = {
        key: 'Vt6L0ppo7tOs9KdnTT6HSHZ/wW1Pfu/rgSs5NVTigN8=',
        method: EncryptionTypes.METHOD.AES256_GCM,
      };
      await expect(
        TransactionsFactory.createEncryptedTransaction('Not parsable', channelKey),
      ).rejects.toThrowError('Data not parsable');
    });
  });
});
