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
  getTransactionsByTopic: (
    topic: string,
    timestampBoundaries?: ITimestampBoundaries,
  ) => Promise<IReturnGetTransactions>;
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

/** return interface for getTransactionsByTopic and getTransactionsByChannelId */
export interface IReturnGetTransactions {
  /** meta information */
  meta: {
    /** location of the transactions (follow the position of the result.transactions) */
    transactionsStorageLocation: string[];
    /** meta-data from the layer below */
    storageMeta?: any;
  };
  /** result of the execution */
  result: { transactions: ITransaction[] };
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

/** Transaction data */
export type ITransactionData = string;
