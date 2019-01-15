import * as Signature from './signature-types';

/** Data Access Layer */
export interface ITransactionLayer {
  persistTransaction: (
    transactionData: string,
    signatureParams: Signature.ISignatureParameters,
    topics?: string[],
  ) => Promise<IRequestDataReturnPersistTransaction>;
  getTransactionsByTopic: (topic: string) => Promise<IRequestDataReturnGetTransactionsByTopic>;
}

/** return interface for PersistTransaction  */
export interface IRequestDataReturnPersistTransaction {
  /** meta information */
  meta: {
    /** location of the persisted transaction */
    transactionStorageLocation: string;
    /** topics used to index the persisted transaction */
    topics: string[];
    /** meta-data from the layer below */
    dataAccessMeta?: any;
  };
  /** result of the execution */
  result: {};
}

/** return interface for getTransactionsByTopic  */
export interface IRequestDataReturnGetTransactionsByTopic {
  /** meta information */
  meta: {
    /** location of the transactions (follow the position of the result.transactions) */
    transactionsStorageLocation: string[];
    /** meta-data from the layer below */
    dataAccessMeta?: any;
  };
  /** result of the execution */
  result: { transactions: ITransaction[] };
}

/** Transaction */
export interface ITransaction {
  data: ITransactionData;
  signature: Signature.ISignature;
}

/** Transaction data */
export type ITransactionData = string;
