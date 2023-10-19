import * as Encryption from './encryption-types.js';
import * as Identity from './identity-types.js';

/** Decryption provider interface */
export interface IDecryptionProvider {
  supportedMethods: Encryption.METHOD[];
  supportedIdentityTypes: Identity.TYPE[];

  decrypt: (
    encryptedData: Encryption.IEncryptedData,
    signer: Identity.IIdentity,
  ) => Promise<string>;
  isIdentityRegistered: (identity: Identity.IIdentity) => Promise<boolean>;
}
