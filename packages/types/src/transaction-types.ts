import * as Encryption from './encryption-types';

/** Transaction Manager interface */
export interface ITransactionManager {
  persistTransaction: (
    transactionData: ITransactionData,
    channelId: string,
    topics?: string[],
  ) => Promise<IReturnPersistTransaction>;
  persistEncryptedTransaction: (
    transactionData: ITransactionData,
    channelId: string,
    encryptionParams: Encryption.IEncryptionParameters[],
    topics?: string[],
  ) => Promise<IReturnPersistTransaction>;
  getTransactionsByChannelId: (
    channelId: string,
    timestampBoundaries?: ITimestampBoundaries,
  ) => Promise<IReturnGetTransactions>;
  getChannelsByTopic: (
    topic: string,
    updatedBetween?: ITimestampBoundaries,
  ) => Promise<IReturnGetTransactionsByChannels>;
}

/** Restrict the get data research to two timestamp */
export interface ITimestampBoundaries {
  from?: number;
  to?: number;
}

/** return interface for PersistTransaction  */
export interface IReturnPersistTransaction {
  /** meta information */
  meta: {
    /** meta-data from the layer below */
    dataAccessMeta?: any;
    /** encryption method used if transaction encrypted */
    encryptionMethod?: string;
  };
  /** result of the execution */
  result: {};
}

/** return interface for getTransactionsByChannelId  */
export interface IReturnGetTransactions {
  /** meta information */
  meta: {
    /** meta-data from the layer below */
    dataAccessMeta?: any;
  };
  /** result of the execution */
  result: { transactions: IConfirmedTransaction[] };
}

/** return interface for getTransactionsByChannelId  */
export interface IReturnGetTransactionsByChannels {
  /** meta information */
  meta: {
    /** meta-data from the layer below */
    dataAccessMeta?: any;
  };
  /** result of the execution */
  result: { transactions: { [key: string]: IConfirmedTransaction[] } };
}

/** Transaction */
export interface ITransaction {
  data: ITransactionData;
  /** Hash of the data before encryption */
  hash?: string;
  /** Symmetric key encrypted with asymmetric key from the parties keys, indexed by the hash of their identities */
  keys?: { [key: string]: string };
  /** Encryption method */
  encryptionMethod?: string;
}

/** Transaction confirmed */
export interface IConfirmedTransaction {
  transaction: ITransaction;
  timestamp: number;
}

/** Transaction data */
export type ITransactionData = string;
