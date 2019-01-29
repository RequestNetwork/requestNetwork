import * as Identity from './identity-types';
import * as Signature from './signature-types';

/** Signature provider interface */
export interface ISignatureProvider {
  supportedMethods: Signature.REQUEST_SIGNATURE_METHOD[];
  supportedIdentityTypes: Identity.REQUEST_IDENTITY_TYPE[];

  sign: (data: any, signer: Identity.IIdentity) => Signature.ISignedData;
}
