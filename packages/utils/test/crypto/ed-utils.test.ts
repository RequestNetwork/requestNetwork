import {
//   edRecover,
  edSign,
  getAddressFromEdPrivateKey,
//   getAddressFromEdPublicKey,
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

// const anyData = 'this is any data!';

/* eslint-disable @typescript-eslint/no-unused-expressions */
describe('Utils/EcUtils', () => {
  describe('getAddressFromEdPrivateKey', () => {
    it.only('can get Address From PrivateKey', async () => {
      const identity = await getAddressFromEdPrivateKey(rawId.privateKey);
      // 'getAddressFromEdPrivateKey() error'
      expect(identity).toBe('681bfe5ad300d997e245c3de3a371e5dc1219cb115ebb1ed901e9f9ea0e7eb16');
    });
    // it('cannot get Address From PrivateKey if the private key is wrong', () => {
    //   // 'getAddressFromEdPrivateKey() error'
    //   expect(() => getAddressFromEdPrivateKey('aa')).toThrowError(
    //     'The private key must be a string representing 32 bytes',
    //   );
    // });
    // it('can get an address from a private key without 0x', () => {
    //   expect(
    //     await getAddressFromEdPrivateKey(
    //       'af16c10a33bd8c2a0d55551080c3eb248ab727e5ff17d052c95f9d92b7e6528e',
    //     ),
    //   ).toBe('0xe011e28aBAa005223a2d4AEfFD5c2fF8D7B5291c');
    // });
  });

//   describe('getAddressFromEdPublicKey', () => {
//     it('can get Address From Public Key', () => {
//       const identity = getAddressFromEdPublicKey(rawId.publicKey);
//       // 'getAddressFromEdPublicKey() error'
//       expect(identity).toBe(rawId.address);
//     });
//     it('cannot get Address From Public Key if the Public key is wrong', () => {
//       // 'getAddressFromEdPrivateKey() error'
//       expect(() => getAddressFromEdPublicKey('aa')).toThrowError(
//         'The public key must be a string representing 64 bytes',
//       );
//     });
//   });

  describe('sign', () => {
    it('can sign', async () => {
      const signature = await edSign(
        rawId.privateKey,
        '0xfd6201dabdd4d7177f7c3baba47c5533b12f0a8127ab5d8c71d831fa4df2b19f',
      );
      // 'sign() error'
      expect(signature).toBe(
        '13c08d0539524c161f0ce2f753c20e146d201f1b6b4d2b05a678a5f4727c0f8ae6379d7292e4012d09b91e6f6553224c770078b1aec6cc92004d57dea4e56103',
      );
    });
    // it('cannot signs if the private key is wrong', () => {
    //   // 'sign() error'
    //   expect(() =>
    //     edSign('aa', '0xfd6201dabdd4d7177f7c3baba47c5533b12f0a8127ab5d8c71d831fa4df2b19f'),
    //   ).toThrowError('The private key must be a string representing 32 bytes');
    // });
  });

//   describe('ecRecover', () => {
//     it('can recover address from a signature', () => {
//       const id = ecRecover(
//         '0xdf4d49c7c01e00a970378e5a400dd4168aed6c43a1c510b124026467c78a3566048549c6ab5e0f618e2939c518e9fbe52e07836d4cb07fa44186fa3ffe3b3b981b',
//         '0xfd6201dabdd4d7177f7c3baba47c5533b12f0a8127ab5d8c71d831fa4df2b19f',
//       );
//       // 'recover() error'
//       expect(id).toEqual(rawId.address);
//     });
//     it('cannot recover address from signature if signature is not well formatted', () => {
//       // 'sign() error'
//       expect(() =>
//         ecRecover('0xaa', '0xfd6201dabdd4d7177f7c3baba47c5533b12f0a8127ab5d8c71d831fa4df2b19f'),
//       ).toThrowError('The signature must be a string representing 66 bytes');
//     });
//   });

});
