import * as Identity from './identity-types.js';
import * as Signature from './signature-types.js';

/** Signature provider interface */
export interface ISignatureProvider {
  supportedMethods: Signature.METHOD[];
  supportedIdentityTypes: Identity.TYPE[];

  sign: (data: any, signer: Identity.IIdentity) => Promise<Signature.ISignedData>;
}
