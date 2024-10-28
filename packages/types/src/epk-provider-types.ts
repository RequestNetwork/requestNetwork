import { CypherProviderTypes } from '.';
import * as Encryption from './encryption-types';
import * as Identity from './identity-types';

/** EPK provider interface */
export interface IEPKProvider extends CypherProviderTypes.ICypherProvider {
  supportedMethods: Encryption.METHOD[];
  supportedIdentityTypes: Identity.TYPE[];
  isIdentityRegistered: (identity: Identity.IIdentity) => Promise<boolean>;
}
