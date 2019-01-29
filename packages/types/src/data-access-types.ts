/** Data Access Layer */
export interface IDataAccess {
  initialize: () => Promise<void>;
  persistTransaction: (
    transactionData: IRequestDataAccessTransaction,
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
    storageMeta?: any;
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
    storageMeta?: any;
  };
  /** result of the execution */
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

/** Topics, to index the transactions */
export interface IRequestDataAccessTopics {
  [key: string]: number[];
}

/** Transaction */
export interface IRequestDataAccessTransaction {
  data: IRequestDataAccessTransactionData;
}

/** Transaction data */
export type IRequestDataAccessTransactionData = string;
