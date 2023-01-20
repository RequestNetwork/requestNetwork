import {
  decryptWithAes256cbc,
  decryptWithAes256gcm,
  encryptWithAes256cbc,
  encryptWithAes256gcm,
  random32Bytes,
  unique,
} from '../../src';

const anyData = 'this is any data!';
const arbitraryKey = '12345678901234567890123456789012';

/* eslint-disable @typescript-eslint/no-unused-expressions */
describe('Utils/cryptoWrapper', () => {
  describe('random32Bytes', () => {
    it('can create a 32 bytes buffer', async () => {
      const randomBytes = await random32Bytes();
      // 'random32Bytes() error'
      expect(Buffer.isBuffer(randomBytes)).toBe(true);
      // eslint-disable-next-line no-magic-numbers
      // 'random32Bytes() error'
      expect(randomBytes.length).toBe(32);
    });

    it('can create 1000 buffers with no duplicates random32Bytes()', async () => {
      // eslint-disable-next-line no-magic-numbers
      const promises = new Array(1000).fill('').map(async () => random32Bytes());
      const randomBytes1000 = await Promise.all(promises);
      // 'randomBytes gives duplicate'
      expect(unique(randomBytes1000).duplicates.length).toBe(0);
    });
  });

  describe('encryptWithAes256cbc', () => {
    it('can encrypt with the aes256-cbc algorithm', async () => {
      const encrypted = await encryptWithAes256cbc(
        Buffer.from(anyData, 'utf8'),
        Buffer.from(arbitraryKey, 'utf8'),
      );
      // 'encryptWithAes256cbc() error'
      expect(Buffer.isBuffer(encrypted)).toBe(true);
      // 'encryptWithAes256cbc() error'
      expect(encrypted.length).toBe(48);

      // 'decrypt() error'
      expect(await decryptWithAes256cbc(encrypted, Buffer.from(arbitraryKey, 'utf8'))).toEqual(
        Buffer.from(anyData, 'utf8'),
      );
    });
  });

  describe('decryptWithAes256cbc', () => {
    it('can decrypt a message encrypted with the aes256-cbc algorithm', async () => {
      const decrypted = await decryptWithAes256cbc(
        Buffer.from('GAM/RiH/7R0MZC03cviYHQmCdH8VrBEAPAhSt2j+IH9ZNCZiut/JtZbVYmcslyWa', 'base64'),
        Buffer.from(arbitraryKey, 'utf8'),
      );
      // 'decryptWithAes256cbc() error'
      expect(Buffer.isBuffer(decrypted)).toBe(true);
      // 'decryptWithAes256cbc() error'
      expect(decrypted).toEqual(Buffer.from(anyData, 'utf8'));
    });
  });

  describe('encryptWithAes256gcm', () => {
    it('can encrypt with the aes256-gcm algorithm', async () => {
      const encrypted = await encryptWithAes256gcm(
        Buffer.from(anyData, 'utf8'),
        Buffer.from(arbitraryKey, 'utf8'),
      );
      // 'encryptWithAes256gcm() error'
      expect(Buffer.isBuffer(encrypted)).toBe(true);
      // 'encryptWithAes256gcm() error'
      expect(encrypted.length).toBe(49);
      // 'decrypt() error'
      expect(await decryptWithAes256gcm(encrypted, Buffer.from(arbitraryKey, 'utf8'))).toEqual(
        Buffer.from(anyData, 'utf8'),
      );
    });
  });
  describe('decryptWithAes256gcm', () => {
    it('can decrypt a message encrypted with the aes256-gcm algorithm', async () => {
      const decrypted = await decryptWithAes256gcm(
        Buffer.from(
          'TTu/6w1cLS6ToK68ILt56eJ/dJGGbo+z/IwGLEg0WfD/naOONpInlrzQ2Zv1vYL+Vg==',
          'base64',
        ),
        Buffer.from(arbitraryKey, 'utf8'),
      );
      // 'decryptWithAes256gcm() error'
      expect(Buffer.isBuffer(decrypted)).toBe(true);
      // 'decryptWithAes256gcm() error'
      expect(decrypted).toEqual(Buffer.from(anyData, 'utf8'));
    });
  });
});
