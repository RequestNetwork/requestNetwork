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
      // 'getAddressFromPrivateKey() error'
      expect(identity).toBe(rawId.address);
    });
    it('cannot get Address From PrivateKey if the private key is wrong', () => {
      // 'getAddressFromPrivateKey() error'
      expect(() => ecUtils.getAddressFromPrivateKey('aa')).toThrowError(
        'The private key must be a string representing 32 bytes',
      );
    });
  });

  describe('getAddressFromPublicKey', () => {
    it('can get Address From Public Key', () => {
      const identity = ecUtils.getAddressFromPublicKey(rawId.publicKey);
      // 'getAddressFromPublicKey() error'
      expect(identity).toBe(rawId.address);
    });
    it('cannot get Address From Public Key if the Public key is wrong', () => {
      // 'getAddressFromPrivateKey() error'
      expect(() => ecUtils.getAddressFromPublicKey('aa')).toThrowError(
        'The public key must be a string representing 64 bytes',
      );
    });
  });

  describe('sign', () => {
    it('can sign', () => {
      const signature = ecUtils.sign(
        rawId.privateKey,
        '0xfd6201dabdd4d7177f7c3baba47c5533b12f0a8127ab5d8c71d831fa4df2b19f',
      );
      // 'sign() error'
      expect(signature).toBe(
        '0xdf4d49c7c01e00a970378e5a400dd4168aed6c43a1c510b124026467c78a3566048549c6ab5e0f618e2939c518e9fbe52e07836d4cb07fa44186fa3ffe3b3b981b',
      );
    });
    it('cannot signs if the private key is wrong', () => {
      // 'sign() error'
      expect(() =>
        ecUtils.sign('aa', '0xfd6201dabdd4d7177f7c3baba47c5533b12f0a8127ab5d8c71d831fa4df2b19f'),
      ).toThrowError('The private key must be a string representing 32 bytes');
    });
  });

  describe('recover', () => {
    it('can recover address from a signature', () => {
      const id = ecUtils.recover(
        '0xdf4d49c7c01e00a970378e5a400dd4168aed6c43a1c510b124026467c78a3566048549c6ab5e0f618e2939c518e9fbe52e07836d4cb07fa44186fa3ffe3b3b981b',
        '0xfd6201dabdd4d7177f7c3baba47c5533b12f0a8127ab5d8c71d831fa4df2b19f',
      );
      // 'recover() error'
      expect(id).toEqual(rawId.address);
    });
    it('cannot recover address from signature if signature is not well formatted', () => {
      // 'sign() error'
      expect(() =>
        ecUtils.recover(
          '0xaa',
          '0xfd6201dabdd4d7177f7c3baba47c5533b12f0a8127ab5d8c71d831fa4df2b19f',
        ),
      ).toThrowError('The signature must be a string representing 66 bytes');
    });
  });

  describe('encrypt', () => {
    it('can encrypt', async () => {
      const encryptedData = await ecUtils.encrypt(rawId.publicKey, anyData);
      // 'encrypt() error'
      expect(encryptedData.length).toBe(226);
      // 'decrypt() error'
      expect(await ecUtils.decrypt(rawId.privateKey, encryptedData)).toBe(anyData);
    });

    it('cannot encrypt data with a wrong public key', async () => {
      await expect(ecUtils.encrypt('cf4a', anyData)).rejects.toThrowError(
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
      // 'decrypt() error'
      expect(data).toBe(anyData);
    });

    it('cannot decrypt data with a wrong private key', async () => {
      await expect(
        ecUtils.decrypt(
          '0xaa',
          '307bac038efaa5bf8a0ac8db53fd4de8024a0c0baf37283a9e6671589eba18edc12b3915ff0df66e6ffad862440228a65ead99e3320e50aa90008961e3d68acc35b314e98020e3280bf4ce4258419dbb775185e60b43e7b88038a776a9322ff7cb3e886b2d92060cff2951ef3beedcc70a',
        ),
      ).rejects.toThrowError('The private key must be a string representing 32 bytes');
    });

    it('cannot decrypt data with a wrong encrypted data: public key too short', async () => {
      await expect(ecUtils.decrypt(rawId.privateKey, 'aa')).rejects.toThrowError(
        'The encrypted data is not well formatted',
      );
    });

    it('cannot decrypt data with a wrong encrypted data: public key not parsable', async () => {
      await expect(
        ecUtils.decrypt(
          rawId.privateKey,
          'e50aa90008961e3d68acc35b314e98020e3280bf4ce4258419dbb775185e60b43e7b88038a776a9322ff7cb3e886b2d92060cff2951ef3beedcc7',
        ),
      ).rejects.toThrowError('The encrypted data is not well formatted');
    });

    it('cannot decrypt data with a wrong encrypted data: bad MAC', async () => {
      await expect(
        ecUtils.decrypt(
          rawId.privateKey,
          '307bac038efaa5bf8a0ac8db53fd4de8024a0c0baf37283a9e6671589eba18edc12b3915ff0df66e6ffad862440228a65ead99e3320e50aa90008961e3d68acc35b314e98020e3280bf4ce4258419dbb775185e60b43e7b88038a776a9322ff7cb3e886b2d92060cff2951ef3beedcc7',
        ),
      ).rejects.toThrowError('The encrypted data is not well formatted');
    });
  });

  it('can encrypt()', async () => {
    const encryptedData = await ecUtils.encrypt(rawId.publicKey, anyData);
    // 'encrypt() error'
    expect(encryptedData.length).toBe(226);
    // 'decrypt() error'
    expect(await ecUtils.decrypt(rawId.privateKey, encryptedData)).toBe(anyData);
  });

  it('can decrypt()', async () => {
    const data = await ecUtils.decrypt(
      rawId.privateKey,
      '307bac038efaa5bf8a0ac8db53fd4de8024a0c0baf37283a9e6671589eba18edc12b3915ff0df66e6ffad862440228a65ead99e3320e50aa90008961e3d68acc35b314e98020e3280bf4ce4258419dbb775185e60b43e7b88038a776a9322ff7cb3e886b2d92060cff2951ef3beedcc70a',
    );
    // 'decrypt() error'
    expect(data).toBe(anyData);
  });
});
