import { EventEmitter } from 'events';
import * as StorageTypes from './storage-types';

/** Data Access Layer */
export interface IDataRead {
  initialize: () => Promise<void>;
  close: () => Promise<void>;

  getTransactionsByChannelId: (
    channelId: string,
    timestampBoundaries?: ITimestampBoundaries,
  ) => Promise<IReturnGetTransactions>;
  getChannelsByTopic: (
    topic: string,
    updatedBetween?: ITimestampBoundaries,
  ) => Promise<IReturnGetChannelsByTopic>;
  getChannelsByMultipleTopics(
    topics: string[],
    updatedBetween?: ITimestampBoundaries,
  ): Promise<IReturnGetChannelsByTopic>;
}

export interface IDataWrite {
  initialize: () => Promise<void>;
  close: () => Promise<void>;

  persistTransaction: (
    transactionData: ITransaction,
    channelId: string,
    topics?: string[],
  ) => Promise<IReturnPersistTransaction>;
}

export interface IDataAccess extends IDataRead, IDataWrite {
  _getStatus(detailed?: boolean): Promise<IDataAccessStatus>;
}

export interface IDataAccessStatus {
  filesIgnored: {
    count: number;
    list?: { [location: string]: string };
  };
  filesRetrieved: {
    count: number;
    lastTimestamp: number | null;
    list?: string[];
  };
  lastSynchronizationTimestamp: number;
  storage: any;
  synchronizationConfig: {
    intervalTime: number;
    successiveFailureThreshold: number;
  };
}

/** Enum of state possible for an action */
export enum TransactionState {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
}

/** Restrict the get data research to two timestamp */
export interface ITimestampBoundaries {
  from?: number;
  to?: number;
}

export type IReturnPersistTransactionRaw = {
  /** meta information */
  meta: {
    /** location of the persisted transaction */
    transactionStorageLocation: string;
    /** topics used to index the persisted transaction */
    topics: string[];
    /** meta-data from the layer below */
    storageMeta?: StorageTypes.IEntryMetadata;
  };
  /** result of the execution */
  result: Record<string, never>;
};

export type IReturnPersistTransaction = EventEmitter & IReturnPersistTransactionRaw;

/** return interface for getTransactionsByChannelId */
export interface IReturnGetTransactions {
  /** meta information */
  meta: {
    /** location of the transactions (follow the position of the result.transactions) */
    transactionsStorageLocation: string[];
    /** meta-data from the layer below */
    storageMeta?: StorageTypes.IEntryMetadata[];
  };
  /** result of the execution */
  result: { transactions: ITimestampedTransaction[] };
}

/** return interface for getChannelsByTopic */
export interface IReturnGetChannelsByTopic {
  /** meta information */
  meta: {
    /** location of the transactions (follow the position of the result.transactions) */
    transactionsStorageLocation: {
      [key: string]: string[];
    };
    /** meta-data from the layer below */
    storageMeta?: Record<string, StorageTypes.IEntryMetadata[] | undefined>;
  };
  /** result of the execution: the transactions grouped by channel id */
  result: { transactions: ITransactionsByChannelIds };
}

/** Block: main data structure of data-access, contains transactions */
export interface IBlock {
  header: IBlockHeader;
  transactions: ITransaction[];
}

/** Block Header */
export interface IBlockHeader {
  channelIds: IChannelIds;
  topics: ITopics;
  version: string;
}

/** Transactions group by channel ids */
export interface ITransactionsByChannelIds {
  [key: string]: ITimestampedTransaction[];
}

/** Channel ids, to connect the transactions to a channel */
export interface IChannelIds {
  [key: string]: number[];
}

/** Topics indexed by channel id to index the transactions */
export interface ITopics {
  [key: string]: string[];
}

/** Transaction */
export interface ITransaction {
  data?: ITransactionData;
  encryptedData?: ITransactionData;
  /** Hash of the data before encryption */
  hash?: string;
  /** Symmetric key encrypted with asymmetric key from the parties keys, indexed by the hash of their identities */
  keys?: { [key: string]: string };
  /** Encryption method */
  encryptionMethod?: string;
}

/** Transaction confirmed */
export interface ITimestampedTransaction {
  state: TransactionState;
  transaction: ITransaction;
  timestamp: number;
}

/** Transaction data */
export type ITransactionData = string;

/**
 * An index to store locations and timestamps of transactions in IPFS.
 */
export interface ITransactionIndex {
  initialize(): Promise<void>;
  getLastTransactionTimestamp(): Promise<number | null>;
  addTransaction(dataId: string, header: IBlockHeader, timestamp: number): Promise<void>;
  getChannelIdsForTopic(
    topic: string,
    timestampBoundaries?: ITimestampBoundaries,
  ): Promise<string[]>;
  getChannelIdsForMultipleTopics(
    topics: string[],
    timestampBoundaries?: ITimestampBoundaries,
  ): Promise<string[]>;
  getIndexedLocations(): Promise<string[]>;
  getStorageLocationList(
    channelId: string,
    timestampBoundaries?: ITimestampBoundaries,
  ): Promise<string[]>;
  updateTimestamp(dataId: string, timestamp: number): Promise<void>;
  removeTransaction(dataId: string): Promise<void>;
}
