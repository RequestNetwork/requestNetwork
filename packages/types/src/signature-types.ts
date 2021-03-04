import { EnumToType } from './shared';

/** Parameters needed to sign */
export interface ISignatureParameters {
  // method of the signature
  method: METHOD;
  // value used to sign
  privateKey: string;
}

/** Signature */
export interface ISignature {
  // method used to sign
  method: METHOD;
  // the signature itself
  value: string;
}

export const METHOD = {
  ECDSA: 'ecdsa',
  ECDSA_ETHEREUM: 'ecdsa-ethereum',
} as const;

/** Supported signature methods */
export type METHOD = EnumToType<typeof METHOD>;

/** Signed data interface */
export interface ISignedData {
  data: any;
  signature: ISignature;
}
