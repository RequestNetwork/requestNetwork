import { expect } from 'chai';
import 'mocha';
import CryptoWrapper from '../../src/crypto/crypto-wrapper';
import utils from '../../src/utils';

const anyData = 'this is any data!';
const arbitraryKey = '12345678901234567890123456789012';

/* tslint:disable:no-unused-expression */
describe('Utils.cryptoWrapper', () => {
  describe('random32Bytes', () => {
    it('can create a 32 bytes buffer', async () => {
      const randomBytes = await CryptoWrapper.random32Bytes();
      expect(Buffer.isBuffer(randomBytes), 'random32Bytes() error').to.be.true;
      // tslint:disable-next-line:no-magic-numbers
      expect(randomBytes.length, 'random32Bytes() error').to.be.equal(32);
    });

    it('can create 1000 buffers with no duplicates random32Bytes()', async () => {
      // tslint:disable-next-line:no-magic-numbers
      const promises = new Array(1000).fill('').map(async () => CryptoWrapper.random32Bytes());
      const randomBytes1000 = await Promise.all(promises);
      expect(
        utils.unique(randomBytes1000).duplicates.length,
        'randomBytes gives duplicate',
      ).to.be.equal(0);
    });
  });

  describe('encryptWithAes256cbc', () => {
    it('can encrypt with the aes256-cbc algorithm', async () => {
      const encrypted = await CryptoWrapper.encryptWithAes256cbc(
        Buffer.from(anyData, 'utf8'),
        Buffer.from(arbitraryKey, 'utf8'),
      );
      expect(Buffer.isBuffer(encrypted), 'encryptWithAes256cbc() error').to.be.true;
      expect(encrypted.length, 'encryptWithAes256cbc() error').to.be.equal(48);

      expect(
        await CryptoWrapper.decryptWithAes256cbc(encrypted, Buffer.from(arbitraryKey, 'utf8')),
        'decrypt() error',
      ).to.be.deep.equal(Buffer.from(anyData, 'utf8'));
    });
  });

  describe('decryptWithAes256cbc', () => {
    it('can decrypt a message encrypted with the aes256-cbc algorithm', async () => {
      const decrypted = await CryptoWrapper.decryptWithAes256cbc(
        Buffer.from('GAM/RiH/7R0MZC03cviYHQmCdH8VrBEAPAhSt2j+IH9ZNCZiut/JtZbVYmcslyWa', 'base64'),
        Buffer.from(arbitraryKey, 'utf8'),
      );
      expect(Buffer.isBuffer(decrypted), 'decryptWithAes256cbc() error').to.be.true;
      expect(decrypted, 'decryptWithAes256cbc() error').to.be.deep.equal(
        Buffer.from(anyData, 'utf8'),
      );
    });
  });
});
