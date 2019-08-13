import { expect } from 'chai';
import 'mocha';
import CryptoWrapper from '../../src/crypto/crypto-wrapper';
import utils from '../../src/utils';

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
});
