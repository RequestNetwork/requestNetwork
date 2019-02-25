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

/** Supported signature methods */
export enum METHOD {
  ECDSA = 'ecdsa',
  ECDSA_ETHEREUM = 'ecdsa-ethereum',
}

/** Signed data interface */
export interface ISignedData {
  data: any;
  signature: ISignature;
}
