import * as Identity from './identity-types';
import * as Signature from './signature-types';

/** Signature provider interface */
export interface ISignatureProvider {
  supportedMethods: Signature.METHOD[];
  supportedIdentityTypes: Identity.TYPE[];

  sign: (data: any, signer: Identity.IIdentity) => Promise<Signature.ISignedData>;
}
