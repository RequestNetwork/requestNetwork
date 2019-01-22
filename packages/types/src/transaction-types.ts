import * as Signature from './signature-types';

/** Transaction Manager interface */
export interface ITransactionManager {
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
