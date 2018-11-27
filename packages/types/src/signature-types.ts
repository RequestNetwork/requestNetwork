// Interface of the parameters needed to sign
export interface ISignatureParameters {
  // method of the signature
  method: REQUEST_SIGNATURE_METHOD;
  // value used to sign
  privateKey: string;
}

// Interface of a signature
export interface ISignature {
  // method used to sign
  method: REQUEST_SIGNATURE_METHOD;
  // the signature itself
  value: string;
}

// Enum of signature method supported by this library
export enum REQUEST_SIGNATURE_METHOD {
  ECDSA = 'ecdsa',
}
