/** Transaction Manager interface */
export interface ITransactionManager {
  persistTransaction: (
    transactionData: string,
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
}

/** Transaction confirmed */
export interface IConfirmedTransaction {
  transaction: ITransaction;
  timestamp: number;
}

/** Transaction data */
export type ITransactionData = string;
