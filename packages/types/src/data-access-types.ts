import * as Signature from './signature-types';

export interface IDataAccess {
  initialize: () => Promise<void>;
  persistTransaction: (
    transactionData: string,
    signatureParams: Signature.ISignatureParameters,
    topics?: string[],
  ) => Promise<string>;
  getTransactionsByTopic: (topic: string) => Promise<string[]>;
}

export interface IRequestDataAccessBlock {
  header: IRequestDataAccessBlockHeader;
  transactions: RequestDataAccessTransactionList;
}

export interface IRequestDataAccessBlockHeader {
  topics: IRequestDataAccessTopics;
  version: string;
}

export interface IRequestDataAccessTopics {
  [key: string]: number[];
}

export type RequestDataAccessTransactionList = IRequestDataAccessTransaction[];

export type IRequestDataAccessTransactionData = string;

export interface IRequestDataAccessTransaction {
  data: IRequestDataAccessTransactionData;
  signature: Signature.ISignature;
}
