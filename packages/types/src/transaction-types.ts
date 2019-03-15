/** Transaction Manager interface */
export interface ITransactionManager {
  persistTransaction: (
    transactionData: string,
    channelId: string,
    topics?: string[],
  ) => Promise<IReturnPersistTransaction>;
  getTransactionsByTopic: (
    topic: string,
    timestampBoundaries?: ITimestampBoundaries,
  ) => Promise<IReturnGetTransactions>;
  getTransactionsByChannelId: (
    channelId: string,
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
    /** meta-data from the layer below */
    dataAccessMeta?: any;
  };
  /** result of the execution */
  result: {};
}

/** return interface for getTransactionsByTopic and getTransactionsByChannelId  */
export interface IReturnGetTransactions {
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
}

/** Transaction data */
export type ITransactionData = string;
