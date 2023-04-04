import * as Identity from './identity-types';
import * as Signature from './signature-types';

export interface ISignatureBatchParameters {
  data: any;
  signer: Identity.IIdentity;
}

/** Signature provider interface */
export interface ISignatureProvider {
  supportedMethods: Signature.METHOD[];
  supportedIdentityTypes: Identity.TYPE[];

  sign: (data: any, signer: Identity.IIdentity) => Promise<Signature.ISignedData>;
  batchSign?: (parameters: ISignatureBatchParameters[]) => Promise<Signature.ISignedData[]>;
}
