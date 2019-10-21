import * as chai from 'chai';
import 'mocha';

const chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);
const expect = chai.expect;

import MultiFormat from '@requestnetwork/multi-format';
import { EncryptionTypes, MultiFormatTypes } from '@requestnetwork/types';
import Utils from '@requestnetwork/utils';
import TransactionsFactory from '../../src/transactions-factory';
import * as TestData from './utils/test-data';

const data = '{ "what": "ever", "it": "is,", "this": "must", "work": true }';

/* tslint:disable:no-unused-expression */
describe('transaction-factory', () => {
  describe('createClearTransaction', () => {
    it('can create clear transaction', async () => {
      const tx = await TransactionsFactory.createClearTransaction(data);

      expect(tx, 'transaction not right').to.deep.equal({ data });
    });
    it('cannot create clear transaction with not parsable data', async () => {
      await expect(
        TransactionsFactory.createClearTransaction('Not parsable'),
        'transaction not right',
      ).to.eventually.be.rejectedWith('Data not parsable');
    });
  });

  describe('createEncryptedTransactionInNewChannel', async () => {
    it('can create encrypted transaction', async () => {
      const encryptedTx = await TransactionsFactory.createEncryptedTransactionInNewChannel(data, [
        TestData.idRaw1.encryptionParams,
        TestData.idRaw2.encryptionParams,
        TestData.idRaw3.encryptionParams,
      ]);
      // tslint:disable-next-line:no-magic-numbers

      if (encryptedTx.encryptedData) {
        // tslint:disable-next-line:no-magic-numbers
        expect(encryptedTx.encryptedData.length, 'encryptedData not right').to.equal(110);
        expect(encryptedTx.encryptedData.slice(0, 2), 'encryptedData not right').to.deep.equal(
          MultiFormatTypes.prefix.AES256_CBC_ENCRYPTED,
        );
      } else {
        expect.fail('encryptedData should not be undefined');
      }

      expect(encryptedTx.encryptionMethod, 'encryptionMethod not right').to.deep.equal(
        `${EncryptionTypes.METHOD.ECIES}-${EncryptionTypes.METHOD.AES256_CBC}`,
      );

      expect(encryptedTx.hash, 'hash not right').to.deep.equal(
        MultiFormat.serialize(Utils.crypto.normalizeKeccak256Hash(JSON.parse(data))),
      );

      expect(Object.keys(encryptedTx.keys || {}).length, 'keys not right').to.deep.equal(3);
      expect(Object.keys(encryptedTx.keys || {}), 'keys not right').to.deep.equal([
        MultiFormat.serialize(TestData.idRaw1.identity),
        MultiFormat.serialize(TestData.idRaw2.identity),
        MultiFormat.serialize(TestData.idRaw3.identity),
      ]);

      expect(
        // tslint:disable-next-line:no-magic-numbers
        Object.values(encryptedTx.keys || {}).every(ek => ek.length === 260),
        'encrypted keys looks wrong',
      ).to.be.true;
      expect(
        Object.values(encryptedTx.keys || {}).every(
          ek => ek.slice(0, 2) === MultiFormatTypes.prefix.ECIES_ENCRYPTED,
        ),
        'encrypted keys looks wrong',
      ).to.be.true;
    });

    it('cannot create encrypted transaction with encryption parameters not ECIES', async () => {
      await expect(
        TransactionsFactory.createEncryptedTransactionInNewChannel(data, [
          TestData.idRaw1.encryptionParams,
          TestData.idRaw2.encryptionParams,
          { method: EncryptionTypes.METHOD.AES256_CBC, key: '0123456789' },
        ]),
      ).to.eventually.rejectedWith(
        `encryptionParams method must be all: ${EncryptionTypes.METHOD.ECIES}`,
      );
    });

    it('cannot create encrypted transaction with not parsable data', async () => {
      await expect(
        TransactionsFactory.createEncryptedTransactionInNewChannel('Not parsable', [
          TestData.idRaw1.encryptionParams,
          TestData.idRaw2.encryptionParams,
        ]),
        'transaction not right',
      ).to.eventually.be.rejectedWith('Data not parsable');
    });
  });

  describe('createEncryptedTransaction', async () => {
    it('can create encrypted transaction', async () => {
      const channelKey = {
        key: 'Vt6L0ppo7tOs9KdnTT6HSHZ/wW1Pfu/rgSs5NVTigN8=',
        method: EncryptionTypes.METHOD.AES256_CBC,
      };
      const encryptedTx = await TransactionsFactory.createEncryptedTransaction(data, channelKey);
      // tslint:disable-next-line:no-magic-numbers

      if (encryptedTx.encryptedData) {
        // tslint:disable-next-line:no-magic-numbers
        expect(encryptedTx.encryptedData.length, 'encryptedData not right').to.equal(110);
        expect(encryptedTx.encryptedData.slice(0, 2), 'encryptedData not right').to.deep.equal(
          MultiFormatTypes.prefix.AES256_CBC_ENCRYPTED,
        );
      } else {
        expect.fail('encryptedData should not be undefined');
      }

      expect(encryptedTx.encryptionMethod, 'encryptionMethod not right').to.be.undefined;

      expect(encryptedTx.hash, 'hash not right').to.equal(
        MultiFormat.serialize(Utils.crypto.normalizeKeccak256Hash(JSON.parse(data))),
      );

      expect(encryptedTx.keys, 'keys not right').to.be.undefined;
    });

    it('cannot create encrypted transaction with encryption parameters not AES256-CBC', async () => {
      const channelKeyWrong = {
        key: 'Vt6L0ppo7tOs9KdnTT6HSHZ/wW1Pfu/rgSs5NVTigN8=',
        method: EncryptionTypes.METHOD.ECIES,
      };
      await expect(
        TransactionsFactory.createEncryptedTransaction(data, channelKeyWrong),
      ).to.eventually.rejectedWith(
        `encryption method not supported for the channel key: ${channelKeyWrong.method}`,
      );
    });

    it('cannot create encrypted transaction with not parsable data', async () => {
      const channelKey = {
        key: 'Vt6L0ppo7tOs9KdnTT6HSHZ/wW1Pfu/rgSs5NVTigN8=',
        method: EncryptionTypes.METHOD.AES256_CBC,
      };
      await expect(
        TransactionsFactory.createEncryptedTransaction('Not parsable', channelKey),
        'transaction not right',
      ).to.eventually.be.rejectedWith('Data not parsable');
    });
  });
});
