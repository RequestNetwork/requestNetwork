import { CipherProviderTypes } from '.';
import * as Encryption from './encryption-types';
import * as Identity from './identity-types';

/** EPK provider interface */
export interface IEpkProvider extends CipherProviderTypes.ICipherProvider {
  supportedMethods: Encryption.METHOD[];
  supportedIdentityTypes: Identity.TYPE[];
  isIdentityRegistered: (identity: Identity.IIdentity) => Promise<boolean>;
}
