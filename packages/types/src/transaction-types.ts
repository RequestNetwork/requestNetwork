import { EventEmitter } from 'events';
import * as Encryption from './encryption-types';

/** Transaction Manager interface */
export interface ITransactionManager {
  persistTransaction: (
    transactionData: ITransactionData,
    channelId: string,
    topics?: string[],
    encryptionParams?: Encryption.IEncryptionParameters[],
  ) => Promise<IReturnPersistTransaction>;
  getTransactionsByChannelId: (
    channelId: string,
    timestampBoundaries?: ITimestampBoundaries,
  ) => Promise<IReturnGetTransactions>;
  getChannelsByTopic: (
    topic: string,
    updatedBetween?: ITimestampBoundaries,
  ) => Promise<IReturnGetTransactionsByChannels>;
  getChannelsByMultipleTopics: (
    topics: string[],
    updatedBetween?: ITimestampBoundaries,
  ) => Promise<IReturnGetTransactionsByChannels>;
}

/** Restrict the get data research to two timestamp */
export interface ITimestampBoundaries {
  from?: number;
  to?: number;
}

/** return interface for PersistTransaction  */
export interface IReturnPersistTransaction extends EventEmitter {
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
    /** encryption method used if transaction encrypted */
    encryptionMethod?: string;
    /** Ignored transactions */
    ignoredTransactions: Array<IIgnoredTransaction | null>;
  };
  /** result of the execution */
  result: { transactions: Array<ITimestampedTransaction | null> };
}

/** return interface for getTransactionsByChannelId  */
export interface IReturnGetTransactionsByChannels {
  /** meta information */
  meta: {
    /** meta-data from the layer below */
    dataAccessMeta?: any;
    /** encryption method used if transaction encrypted */
    encryptionMethod?: string;
    /** Ignored transactions */
    ignoredTransactions: { [key: string]: Array<IIgnoredTransaction | null> };
  };
  /** result of the execution */
  result: { transactions: { [key: string]: Array<ITimestampedTransaction | null> } };
}

/** Persisted Transaction in data-access */
export interface IPersistedTransaction {
  data?: ITransactionData;
  encryptedData?: ITransactionData;
  /** Symmetric key encrypted with asymmetric key from the parties keys, indexed by the hash of their identities */
  keys?: IKeysDictionary;
  /** Encryption method */
  encryptionMethod?: string;
}

/** Enum of state possible for an action */
export enum TransactionState {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
}

/** Transaction confirmed */
export interface ITimestampedTransaction {
  state: TransactionState;
  transaction: IPersistedTransaction;
  timestamp: number;
}

/** Transaction data */
export type ITransactionData = string;

/** Ignored transaction */
export interface IIgnoredTransaction {
  transaction: ITimestampedTransaction;
  reason: string;
}

/** Transaction class */
export interface ITransaction {
  getData: () => Promise<ITransactionData>;
  getHash: () => Promise<string>;
  getError: () => Promise<string>;
}

/** Keys dictionary */
export interface IKeysDictionary {
  [key: string]: string;
}

/** Channel type */
export enum ChannelType {
  UNKNOWN,
  CLEAR,
  ENCRYPTED,
}
