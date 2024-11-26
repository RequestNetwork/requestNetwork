import * as StorageTypes from './storage-types';
import { ConfirmationEventEmitter } from './events';
import { AuthSig } from '@lit-protocol/types';
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
    page?: number,
    pageSize?: number,
  ) => Promise<IReturnGetChannelsByTopic>;
  getChannelsByMultipleTopics(
    topics: string[],
    updatedBetween?: ITimestampBoundaries,
    page?: number,
    pageSize?: number,
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
  _getStatus?(): Promise<IDataAccessStatus>;
  getLitCapacityDelegationAuthSig?: (delegateeAddress: string) => Promise<AuthSig>;
}

export interface IDataAccessStatus {
  storage: any;
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

export type PersistTransactionEmitter = ConfirmationEventEmitter<IReturnPersistTransactionRaw>;

export type IReturnPersistTransaction = PersistTransactionEmitter & IReturnPersistTransactionRaw;

/** return interface for getTransactionsByChannelId */
export interface IReturnGetTransactions {
  /** meta information */
  meta: {
    /** location of the transactions (follow the position of the result.transactions) */
    transactionsStorageLocation: string[];
    /** meta-data from the layer below */
    storageMeta?: StorageTypes.IEntryMetadata[];
    pagination?: StorageTypes.PaginationMetadata;
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
    pagination?: StorageTypes.PaginationMetadata;
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

export type PendingItem = {
  topics: string[];
  transaction: ITransaction;
  storageResult: StorageTypes.IEntry;
};
export interface IPendingStore {
  get(channelId: string): PendingItem | undefined;

  findByTopics(topic: string[]): (PendingItem & { channelId: string })[];

  add(channelId: string, item: PendingItem): void;

  remove(channelId: string): void;
}

export { AuthSig };
