import * as Signature from './signature-types';

export interface IDataAccess {
  initialize: () => Promise<void>;
  persistTransaction: (
    transactionData: string,
    signatureParams: Signature.ISignatureParameters,
    indexes?: string[],
  ) => Promise<string>;
  getTransactionsByIndex: (index: string) => Promise<string[]>;
}

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

export type IRequestDataAccessTransactionData = string;

export interface IRequestDataAccessTransaction {
  data: IRequestDataAccessTransactionData;
  signature: Signature.ISignature;
}
