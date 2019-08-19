import * as chai from 'chai';
import 'mocha';

const chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);
const expect = chai.expect;

import ecUtils from '../../src/crypto/ec-utils';

const rawId = {
  address: '0x818B6337657A23F58581715Fc610577292e521D0',
  identity: {
    type: 'ethereumAddress',
    value: '0x818B6337657A23F58581715Fc610577292e521D0',
  },
  privateKey: '0x4025da5692759add08f98f4b056c41c71916a671cedc7584a80d73adc7fb43c0',
  publicKey:
    'cf4a1d0bbef8bf0e3fa479a9def565af1b22ea6266294061bfb430701b54a83699e3d47bf52e9f0224dcc29a02721810f1f624f1f70ea3cc5f1fb752cfed379d',
};

const anyData = 'this is any data!';

/* tslint:disable:no-unused-expression */
describe('Utils.ecUtils', () => {
  describe('getAddressFromPrivateKey', () => {
    it('can get Address From PrivateKey', () => {
      const identity = ecUtils.getAddressFromPrivateKey(rawId.privateKey);
      expect(identity, 'getAddressFromPrivateKey() error').to.be.equal(rawId.address);
    });
    it('cannot get Address From PrivateKey if the private key is wrong', () => {
      expect(
        () => ecUtils.getAddressFromPrivateKey('aa'),
        'getAddressFromPrivateKey() error',
      ).to.throw('The private key must be a string representing 32 bytes');
    });
  });

  describe('getAddressFromPublicKey', () => {
    it('can get Address From Public Key', () => {
      const identity = ecUtils.getAddressFromPublicKey(rawId.publicKey);
      expect(identity, 'getAddressFromPublicKey() error').to.be.equal(rawId.address);
    });
    it('cannot get Address From Public Key if the Public key is wrong', () => {
      expect(
        () => ecUtils.getAddressFromPublicKey('aa'),
        'getAddressFromPrivateKey() error',
      ).to.throw('The public key must be a string representing 64 bytes');
    });
  });

  describe('sign', () => {
    it('can sign', () => {
      const signature = ecUtils.sign(
        rawId.privateKey,
        '0xfd6201dabdd4d7177f7c3baba47c5533b12f0a8127ab5d8c71d831fa4df2b19f',
      );
      expect(signature, 'sign() error').to.be.equal(
        '0xdf4d49c7c01e00a970378e5a400dd4168aed6c43a1c510b124026467c78a3566048549c6ab5e0f618e2939c518e9fbe52e07836d4cb07fa44186fa3ffe3b3b981b',
      );
    });
    it('cannot signs if the private key is wrong', () => {
      expect(
        () =>
          ecUtils.sign('aa', '0xfd6201dabdd4d7177f7c3baba47c5533b12f0a8127ab5d8c71d831fa4df2b19f'),
        'sign() error',
      ).to.throw('The private key must be a string representing 32 bytes');
    });
  });

  describe('recover', () => {
    it('can recover address from a signature', () => {
      const id = ecUtils.recover(
        '0xdf4d49c7c01e00a970378e5a400dd4168aed6c43a1c510b124026467c78a3566048549c6ab5e0f618e2939c518e9fbe52e07836d4cb07fa44186fa3ffe3b3b981b',
        '0xfd6201dabdd4d7177f7c3baba47c5533b12f0a8127ab5d8c71d831fa4df2b19f',
      );
      expect(id, 'recover() error').to.be.deep.equal(rawId.address);
    });
    it('cannot recover address from signature if signature is not well formatted', () => {
      expect(
        () =>
          ecUtils.recover(
            '0xaa',
            '0xfd6201dabdd4d7177f7c3baba47c5533b12f0a8127ab5d8c71d831fa4df2b19f',
          ),
        'sign() error',
      ).to.throw('The signature must be a string representing 66 bytes');
    });
  });

  describe('encrypt', () => {
    it('can encrypt', async () => {
      const encryptedData = await ecUtils.encrypt(rawId.publicKey, anyData);
      expect(encryptedData.length, 'encrypt() error').to.be.equal(226);
      expect(await ecUtils.decrypt(rawId.privateKey, encryptedData), 'decrypt() error').to.be.equal(
        anyData,
      );
    });

    it('cannot encrypt data with a wrong public key', async () => {
      await expect(ecUtils.encrypt('cf4a', anyData), 'encrypt() error').to.eventually.rejectedWith(
        'The public key must be a string representing 64 bytes',
      );
    });
  });

  describe('decrypt', () => {
    it('can decrypt', async () => {
      const data = await ecUtils.decrypt(
        rawId.privateKey,
        '307bac038efaa5bf8a0ac8db53fd4de8024a0c0baf37283a9e6671589eba18edc12b3915ff0df66e6ffad862440228a65ead99e3320e50aa90008961e3d68acc35b314e98020e3280bf4ce4258419dbb775185e60b43e7b88038a776a9322ff7cb3e886b2d92060cff2951ef3beedcc70a',
      );
      expect(data, 'decrypt() error').to.be.equal(anyData);
    });

    it('cannot decrypt data with a wrong private key', async () => {
      await expect(
        ecUtils.decrypt(
          '0xaa',
          '307bac038efaa5bf8a0ac8db53fd4de8024a0c0baf37283a9e6671589eba18edc12b3915ff0df66e6ffad862440228a65ead99e3320e50aa90008961e3d68acc35b314e98020e3280bf4ce4258419dbb775185e60b43e7b88038a776a9322ff7cb3e886b2d92060cff2951ef3beedcc70a',
        ),
        'encrypt() error',
      ).to.eventually.rejectedWith('The private key must be a string representing 32 bytes');
    });

    it('cannot decrypt data with a wrong encrypted data: public key too short', async () => {
      await expect(
        ecUtils.decrypt(rawId.privateKey, 'aa'),
        'encrypt() error',
      ).to.eventually.rejectedWith('The encrypted data is not well formatted');
    });

    it('cannot decrypt data with a wrong encrypted data: public key not parsable', async () => {
      await expect(
        ecUtils.decrypt(
          rawId.privateKey,
          'e50aa90008961e3d68acc35b314e98020e3280bf4ce4258419dbb775185e60b43e7b88038a776a9322ff7cb3e886b2d92060cff2951ef3beedcc7',
        ),
        'encrypt() error',
      ).to.eventually.rejectedWith('The encrypted data is not well formatted');
    });

    it('cannot decrypt data with a wrong encrypted data: bad MAC', async () => {
      await expect(
        ecUtils.decrypt(
          rawId.privateKey,
          '307bac038efaa5bf8a0ac8db53fd4de8024a0c0baf37283a9e6671589eba18edc12b3915ff0df66e6ffad862440228a65ead99e3320e50aa90008961e3d68acc35b314e98020e3280bf4ce4258419dbb775185e60b43e7b88038a776a9322ff7cb3e886b2d92060cff2951ef3beedcc7',
        ),
        'encrypt() error',
      ).to.eventually.rejectedWith('The encrypted data is not well formatted');
    });
  });

  it('can encrypt()', async () => {
    const encryptedData = await ecUtils.encrypt(rawId.publicKey, anyData);
    expect(encryptedData.length, 'encrypt() error').to.be.equal(226);
    expect(await ecUtils.decrypt(rawId.privateKey, encryptedData), 'decrypt() error').to.be.equal(
      anyData,
    );
  });

  it('can decrypt()', async () => {
    const data = await ecUtils.decrypt(
      rawId.privateKey,
      '307bac038efaa5bf8a0ac8db53fd4de8024a0c0baf37283a9e6671589eba18edc12b3915ff0df66e6ffad862440228a65ead99e3320e50aa90008961e3d68acc35b314e98020e3280bf4ce4258419dbb775185e60b43e7b88038a776a9322ff7cb3e886b2d92060cff2951ef3beedcc70a',
    );
    expect(data, 'decrypt() error').to.be.equal(anyData);
  });
});
