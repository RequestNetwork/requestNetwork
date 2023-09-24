import {
  ecDecrypt,
  ecEncrypt,
  ecRecover,
  ecSign,
  getAddressFromEcPrivateKey,
  getAddressFromEcPublicKey,
} from '../../src';

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

/* eslint-disable @typescript-eslint/no-unused-expressions */
describe('Utils/EcUtils', () => {
  describe('getAddressFromEcPrivateKey', () => {
    it('can get Address From PrivateKey', () => {
      const identity = getAddressFromEcPrivateKey(rawId.privateKey);
      // 'getAddressFromEcPrivateKey() error'
      expect(identity).toBe(rawId.address);
    });
    it('cannot get Address From PrivateKey if the private key is wrong', () => {
      // 'getAddressFromEcPrivateKey() error'
      expect(() => getAddressFromEcPrivateKey('aa')).toThrowError(
        'The private key must be a string representing 32 bytes',
      );
    });
    it('can get an address from a private key without 0x', () => {
      expect(
        getAddressFromEcPrivateKey(
          'af16c10a33bd8c2a0d55551080c3eb248ab727e5ff17d052c95f9d92b7e6528e',
        ),
      ).toBe('0xe011e28aBAa005223a2d4AEfFD5c2fF8D7B5291c');
    });
  });

  describe('getAddressFromEcPublicKey', () => {
    it('can get Address From Public Key', () => {
      const identity = getAddressFromEcPublicKey(rawId.publicKey);
      // 'getAddressFromEcPublicKey() error'
      expect(identity).toBe(rawId.address);
    });
    it('cannot get Address From Public Key if the Public key is wrong', () => {
      // 'getAddressFromEcPrivateKey() error'
      expect(() => getAddressFromEcPublicKey('aa')).toThrowError(
        'The public key must be a string representing 64 bytes',
      );
    });
  });

  describe('sign', () => {
    it('can sign', () => {
      const signature = ecSign(
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
        ecSign('aa', '0xfd6201dabdd4d7177f7c3baba47c5533b12f0a8127ab5d8c71d831fa4df2b19f'),
      ).toThrowError('The private key must be a string representing 32 bytes');
    });
  });

  describe('ecRecover', () => {
    it('can recover address from a signature', () => {
      const id = ecRecover(
        '0xdf4d49c7c01e00a970378e5a400dd4168aed6c43a1c510b124026467c78a3566048549c6ab5e0f618e2939c518e9fbe52e07836d4cb07fa44186fa3ffe3b3b981b',
        '0xfd6201dabdd4d7177f7c3baba47c5533b12f0a8127ab5d8c71d831fa4df2b19f',
      );
      // 'recover() error'
      expect(id).toEqual(rawId.address);
    });
    it('cannot recover address from signature if signature is not well formatted', () => {
      // 'sign() error'
      expect(() =>
        ecRecover('0xaa', '0xfd6201dabdd4d7177f7c3baba47c5533b12f0a8127ab5d8c71d831fa4df2b19f'),
      ).toThrowError('The signature must be a string representing 66 bytes');
    });
  });

  describe('encrypt', () => {
    it('can encrypt', async () => {
      const encryptedData = await ecEncrypt(rawId.publicKey, anyData);
      // 'encrypt() error'
      expect(encryptedData.length).toBe(226);
      // 'decrypt() error'
      expect(await ecDecrypt(rawId.privateKey, encryptedData)).toBe(anyData);
    });

    it('can encrypt with other public key formats', async () => {
      const encryptedData = await ecEncrypt(
        '0396212fc129c2f78771218b2e93da7a5aac63490a42bb41b97848c39c14fe65cd',
        anyData,
      );
      expect(encryptedData.length).toBe(226);
    });

    it('cannot encrypt data with a wrong public key', async () => {
      await expect(ecEncrypt('cf4a', anyData)).rejects.toThrowError(
        'The public key must be a string representing 64 bytes',
      );
    });
  });

  describe('decrypt', () => {
    it('can decrypt', async () => {
      const data = await ecDecrypt(
        rawId.privateKey,
        '307bac038efaa5bf8a0ac8db53fd4de8024a0c0baf37283a9e6671589eba18edc12b3915ff0df66e6ffad862440228a65ead99e3320e50aa90008961e3d68acc35b314e98020e3280bf4ce4258419dbb775185e60b43e7b88038a776a9322ff7cb3e886b2d92060cff2951ef3beedcc70a',
      );
      // 'decrypt() error'
      expect(data).toBe(anyData);
    });

    it('cannot decrypt data with a wrong private key', async () => {
      await expect(
        ecDecrypt(
          '0xaa',
          '307bac038efaa5bf8a0ac8db53fd4de8024a0c0baf37283a9e6671589eba18edc12b3915ff0df66e6ffad862440228a65ead99e3320e50aa90008961e3d68acc35b314e98020e3280bf4ce4258419dbb775185e60b43e7b88038a776a9322ff7cb3e886b2d92060cff2951ef3beedcc70a',
        ),
      ).rejects.toThrowError('The private key must be a string representing 32 bytes');
    });

    it('cannot decrypt data with a wrong encrypted data: public key too short', async () => {
      await expect(ecDecrypt(rawId.privateKey, 'aa')).rejects.toThrowError(
        'The encrypted data is not well formatted',
      );
    });

    it('cannot decrypt data with a wrong encrypted data: public key not parsable', async () => {
      await expect(
        ecDecrypt(
          rawId.privateKey,
          'e50aa90008961e3d68acc35b314e98020e3280bf4ce4258419dbb775185e60b43e7b88038a776a9322ff7cb3e886b2d92060cff2951ef3beedcc7',
        ),
      ).rejects.toThrowError('The encrypted data is not well formatted');
    });

    it('cannot decrypt data with a wrong encrypted data: bad MAC', async () => {
      await expect(
        ecDecrypt(
          rawId.privateKey,
          '307bac038efaa5bf8a0ac8db53fd4de8024a0c0baf37283a9e6671589eba18edc12b3915ff0df66e6ffad862440228a65ead99e3320e50aa90008961e3d68acc35b314e98020e3280bf4ce4258419dbb775185e60b43e7b88038a776a9322ff7cb3e886b2d92060cff2951ef3beedcc7',
        ),
      ).rejects.toThrowError('The encrypted data is not well formatted');
    });
  });

  it('can encrypt()', async () => {
    const encryptedData = await ecEncrypt(rawId.publicKey, anyData);
    // 'encrypt() error'
    expect(encryptedData.length).toBe(226);
    // 'decrypt() error'
    expect(await ecDecrypt(rawId.privateKey, encryptedData)).toBe(anyData);
  });

  it('can decrypt()', async () => {
    const data = await ecDecrypt(
      rawId.privateKey,
      '307bac038efaa5bf8a0ac8db53fd4de8024a0c0baf37283a9e6671589eba18edc12b3915ff0df66e6ffad862440228a65ead99e3320e50aa90008961e3d68acc35b314e98020e3280bf4ce4258419dbb775185e60b43e7b88038a776a9322ff7cb3e886b2d92060cff2951ef3beedcc70a',
    );
    // 'decrypt() error'
    expect(data).toBe(anyData);
  });
});
