import * as chai from 'chai';
import 'mocha';

const chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);
const expect = chai.expect;

import { EncryptionTypes, MultiFormatTypes } from '@requestnetwork/types';
import Utils from '@requestnetwork/utils';
import TransactionCore from '../../src/transaction';
import * as TestData from './utils/test-data';

/* tslint:disable:no-unused-expression */
describe('transaction', () => {
  describe('createTransaction', () => {
    it('can create transaction', () => {
      const data = '{ what: "ever", it: "is,", this: "must", work: true }';

      const tx = TransactionCore.createTransaction(data);

      expect(tx, 'transaction not right').to.deep.equal({ data });
    });
  });

  describe('createEncryptedTransaction', async () => {
    it('can create encrypted transaction', async () => {
      const data = '{ what: "ever", it: "is,", this: "must", work: true }';

      const encryptedTx = await TransactionCore.createEncryptedTransaction(data, [
        TestData.idRaw1.encryptionParams,
        TestData.idRaw2.encryptionParams,
        TestData.idRaw3.encryptionParams,
      ]);

      // tslint:disable-next-line:no-magic-numbers
      expect(encryptedTx.data.length, 'encryptedData not right').to.deep.equal(110);
      expect(encryptedTx.data.slice(0, 2), 'encryptedData not right').to.deep.equal(
        MultiFormatTypes.prefix.AES256_CBC_ENCRYPTED,
      );

      expect(encryptedTx.encryptionMethod, 'encryptionMethod not right').to.deep.equal(
        `${EncryptionTypes.METHOD.ECIES}-${EncryptionTypes.METHOD.AES256_CBC}`,
      );

      expect(encryptedTx.hash, 'hash not right').to.deep.equal(
        Utils.crypto.normalizeKeccak256Hash(data),
      );

      expect(Object.keys(encryptedTx.keys || {}).length, 'keys not right').to.deep.equal(3);
      expect(Object.keys(encryptedTx.keys || {}), 'keys not right').to.deep.equal([
        Utils.crypto.normalizeKeccak256Hash(TestData.idRaw1.identity),
        Utils.crypto.normalizeKeccak256Hash(TestData.idRaw2.identity),
        Utils.crypto.normalizeKeccak256Hash(TestData.idRaw3.identity),
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
      const data = '{ what: "ever", it: "is,", this: "must", work: true }';

      await expect(
        TransactionCore.createEncryptedTransaction(data, [
          TestData.idRaw1.encryptionParams,
          TestData.idRaw2.encryptionParams,
          { method: EncryptionTypes.METHOD.AES256_CBC, key: '0123456789' },
        ]),
      ).to.eventually.rejectedWith(
        `encryptionParams method must be all: ${EncryptionTypes.METHOD.ECIES}`,
      );
    });
  });
});
