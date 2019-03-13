/** Data Access Layer */
export interface IDataAccess {
  initialize: () => Promise<void>;
  persistTransaction: (
    transactionData: ITransaction,
    topics?: string[],
  ) => Promise<IReturnPersistTransaction>;
  getTransactionsByTopic: (
    topic: string,
    timestampBoundaries?: ITimestampBoundaries,
  ) => Promise<IReturnGetTransactionsByTopic>;
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

/** return interface for getTransactionsByTopic  */
export interface IReturnGetTransactionsByTopic {
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
  topics: ITopics;
  version: string;
}

/** Topics, to index the transactions */
export interface ITopics {
  [key: string]: number[];
}

/** Transaction */
export interface ITransaction {
  data: ITransactionData;
}

/** Transaction data */
export type ITransactionData = string;
