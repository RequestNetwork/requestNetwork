import * as Encryption from './encryption-types';
import * as Identity from './identity-types';

/** Decryption provider interface */
export interface IDecryptionProvider {
  supportedMethods: Encryption.METHOD[];
  supportedIdentityTypes: Identity.TYPE[];

  decrypt: (data: string, signer: Identity.IIdentity) => Promise<string>;
  isIdentityRegistered: (identity: Identity.IIdentity) => Promise<boolean>;
}
