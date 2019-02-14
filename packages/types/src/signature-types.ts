/** Parameters needed to sign */
export interface ISignatureParameters {
  // method of the signature
  method: REQUEST_SIGNATURE_METHOD;
  // value used to sign
  privateKey: string;
}

/** Signature */
export interface ISignature {
  // method used to sign
  method: REQUEST_SIGNATURE_METHOD;
  // the signature itself
  value: string;
}

/** Supported signature methods */
export enum REQUEST_SIGNATURE_METHOD {
  ECDSA = 'ecdsa',
}

/** Signed data interface */
export interface ISignedData {
  data: any;
  signature: ISignature;
}
