import * as RequestEnum from './enum';

export interface IRequestDataAccessBlock {
  header: IRequestDataAccessBlockHeader;
  transactions: RequestDataAccessTransactionList;
}

export interface IRequestDataAccessBlockHeader {
  index: IRequestDataAccessIndex;
  version: string;
}

export interface IRequestDataAccessIndex {
  [key: string]: number[];
}

export type RequestDataAccessTransactionList = IRequestDataAccessTransaction[];

export interface IRequestDataAccessTransaction {
  data: any;
  signature: IRequestDataAccessSignature;
}

// Interface of a signature
export interface IRequestDataAccessSignature {
  // method used to sign
  method: RequestEnum.REQUEST_DATA_ACCESS_SIGNATURE_METHOD;
  // the signature itself
  value: string;
}

// Interface of the parameters needed to sign
export interface IRequestDataAccessSignatureParameters {
  // method of the signature
  method: RequestEnum.REQUEST_DATA_ACCESS_SIGNATURE_METHOD;
  // value used to sign
  privateKey: string;
}

// Interface of an identity object
export interface IRequestDataAccessIdentity {
  // type of the identification
  type: RequestEnum.REQUEST_DATA_ACCESS_IDENTITY_TYPE;
  // the identification itself
  value: string;
}
