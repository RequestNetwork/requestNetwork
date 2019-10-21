import { DecryptionProviderTypes, EncryptionTypes, IdentityTypes } from '@requestnetwork/types';
import Utils from '@requestnetwork/utils';

export const idRaw1 = {
  address: '0xaf083f77f1ffd54218d91491afd06c9296eac3ce',
  decryptionParams: {
    key: '0x04674d2e53e0e14653487d7323cc5f0a7959c83067f5654cafe4094bde90fa8a',
    method: EncryptionTypes.METHOD.ECIES,
  },
  encryptionParams: {
    key:
      '299708c07399c9b28e9870c4e643742f65c94683f35d1b3fc05d0478344ee0cc5a6a5e23f78b5ff8c93a04254232b32350c8672d2873677060d5095184dad422',
    method: EncryptionTypes.METHOD.ECIES,
  },
  identity: {
    type: IdentityTypes.TYPE.ETHEREUM_ADDRESS,
    value: '0xaf083f77f1ffd54218d91491afd06c9296eac3ce',
  },
  privateKey: '0x04674d2e53e0e14653487d7323cc5f0a7959c83067f5654cafe4094bde90fa8a',
  publicKey:
    '299708c07399c9b28e9870c4e643742f65c94683f35d1b3fc05d0478344ee0cc5a6a5e23f78b5ff8c93a04254232b32350c8672d2873677060d5095184dad422',
};

export const idRaw2 = {
  address: '0x740fc87bd3f41d07d23a01dec90623ebc5fed9d6',
  decryptionParams: {
    key: '0x0906ff14227cead2b25811514302d57706e7d5013fcc40eca5985b216baeb998',
    method: EncryptionTypes.METHOD.ECIES,
  },
  encryptionParams: {
    key:
      '9008306d319755055226827c22f4b95552c799bae7af0e99780cf1b5500d9d1ecbdbcf6f27cdecc72c97fef3703c54b717bca613894212e0b2525cbb2d1161b9',
    method: EncryptionTypes.METHOD.ECIES,
  },
  identity: {
    type: IdentityTypes.TYPE.ETHEREUM_ADDRESS,
    value: '0x740fc87bd3f41d07d23a01dec90623ebc5fed9d6',
  },
  privateKey: '0x0906ff14227cead2b25811514302d57706e7d5013fcc40eca5985b216baeb998',
  publicKey:
    '9008306d319755055226827c22f4b95552c799bae7af0e99780cf1b5500d9d1ecbdbcf6f27cdecc72c97fef3703c54b717bca613894212e0b2525cbb2d1161b9',
};

export const idRaw3 = {
  address: '0x818b6337657a23f58581715fc610577292e521d0',
  decryptionParams: {
    key: '0x4025da5692759add08f98f4b056c41c71916a671cedc7584a80d73adc7fb43c0',
    method: EncryptionTypes.METHOD.ECIES,
  },
  encryptionParams: {
    key:
      'cf4a1d0bbef8bf0e3fa479a9def565af1b22ea6266294061bfb430701b54a83699e3d47bf52e9f0224dcc29a02721810f1f624f1f70ea3cc5f1fb752cfed379d',
    method: EncryptionTypes.METHOD.ECIES,
  },
  identity: {
    type: IdentityTypes.TYPE.ETHEREUM_ADDRESS,
    value: '0x818b6337657a23f58581715fc610577292e521d0',
  },
  privateKey: '0x4025da5692759add08f98f4b056c41c71916a671cedc7584a80d73adc7fb43c0',
  publicKey:
    'cf4a1d0bbef8bf0e3fa479a9def565af1b22ea6266294061bfb430701b54a83699e3d47bf52e9f0224dcc29a02721810f1f624f1f70ea3cc5f1fb752cfed379d',
};

export const fakeDecryptionProvider: DecryptionProviderTypes.IDecryptionProvider = {
  decrypt: (
    data: EncryptionTypes.IEncryptedData,
    identity: IdentityTypes.IIdentity,
  ): Promise<string> => {
    switch (identity.value.toLowerCase()) {
      case idRaw1.address:
        return Utils.encryption.decrypt(data, idRaw1.decryptionParams);
      case idRaw2.address:
        return Utils.encryption.decrypt(data, idRaw2.decryptionParams);
      case idRaw3.address:
        return Utils.encryption.decrypt(data, idRaw3.decryptionParams);
      default:
        throw new Error('Identity not registered');
    }
  },
  isIdentityRegistered: async (identity: IdentityTypes.IIdentity): Promise<boolean> => {
    return [idRaw1.address, idRaw2.address, idRaw3.address].includes(identity.value.toLowerCase());
  },
  supportedIdentityTypes: [IdentityTypes.TYPE.ETHEREUM_ADDRESS],
  supportedMethods: [EncryptionTypes.METHOD.ECIES],
};
