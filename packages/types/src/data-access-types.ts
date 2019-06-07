/** Data Access Layer */
export interface IDataAccess {
  initialize: () => Promise<void>;
  persistTransaction: (
    transactionData: ITransaction,
    channelId: string,
    topics?: string[],
  ) => Promise<IReturnPersistTransaction>;
  getTransactionsByChannelId: (
    channelId: string,
    timestampBoundaries?: ITimestampBoundaries,
  ) => Promise<IReturnGetTransactions>;
  getChannelsByTopic: (
    topic: string,
    updatedBetween?: ITimestampBoundaries,
  ) => Promise<IReturnGetChannelsByTopic>;
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
    /** location of the persisted transaction */
    transactionStorageLocation: string;
    /** topics used to index the persisted transaction */
    topics: string[];
    /** meta-data from the layer below */
    storageMeta?: any;
  };
  /** result of the execution */
  result: {};
}

/** return interface for getTransactionsByChannelId */
export interface IReturnGetTransactions {
  /** meta information */
  meta: {
    /** location of the transactions (follow the position of the result.transactions) */
    transactionsStorageLocation: string[];
    /** meta-data from the layer below */
    storageMeta?: any;
  };
  /** result of the execution */
  result: { transactions: IConfirmedTransaction[] };
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
    storageMeta?: any;
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
  [key: string]: IConfirmedTransaction[];
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
  data: ITransactionData;
}

/** Transaction confirmed */
export interface IConfirmedTransaction {
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
  getChannelIdsForTopic(topic: string, timestampBoundaries?: ITimestampBoundaries): Promise<string[]>;
  getStorageLocationList(channelId: string, timestampBoundaries?: ITimestampBoundaries): Promise<string[]>;
}
