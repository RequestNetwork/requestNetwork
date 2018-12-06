import * as Signature from './signature-types';

/** Data Access Layer */
export interface IDataAccess {
  initialize: () => Promise<void>;
  persistTransaction: (
    transactionData: string,
    signatureParams: Signature.ISignatureParameters,
    topics?: string[],
  ) => Promise<IRequestDataReturnPersistTransaction>;
  getTransactionsByTopic: (
    topic: string,
  ) => Promise<IRequestDataReturnGetTransactionsByTopic>;
}

/** return interface for PersistTransaction  */
export interface IRequestDataReturnPersistTransaction {
  meta: {
    // location of the persisted transaction
    transactionStorageLocation: string;
    // topics used to index the persisted transaction
    topics: string[];
    // meta-data from the layer below
    metaStorage?: any;
  };
  result: {};
}

/** return interface for getTransactionsByTopic  */
export interface IRequestDataReturnGetTransactionsByTopic {
  meta: {
    // location of the transactions (follow the position of the result.transactions)
    transactionsStorageLocation: string[];
    // meta-data from the layer below
    metaStorage?: any;
  };
  result: { transactions: IRequestDataAccessTransaction[] };
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
