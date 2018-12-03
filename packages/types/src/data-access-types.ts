import * as Signature from './signature-types';

/** Data Access Layer */
export interface IDataAccess {
  initialize: () => Promise<void>;
  persistTransaction: (
    transactionData: string,
    signatureParams: Signature.ISignatureParameters,
    topics?: string[],
  ) => Promise<string>;
  getTransactionsByTopic: (topic: string) => Promise<string[]>;
}

/** Block: main data structure of data-access, contains transactions */
export interface IRequestDataAccessBlock {
  header: IRequestDataAccessBlockHeader;
  transactions: IRequestDataAccessTransaction[];
}

/** Block Header */
export interface IRequestDataAccessBlockHeader {
  topics: IRequestDataAccessTopics;
  version: string;
}

/** Topics, to index the transctions */
export interface IRequestDataAccessTopics {
  [key: string]: number[];
}

/** Transaction */
export interface IRequestDataAccessTransaction {
  data: IRequestDataAccessTransactionData;
  signature: Signature.ISignature;
}

/** Transaction data */
export type IRequestDataAccessTransactionData = string;
