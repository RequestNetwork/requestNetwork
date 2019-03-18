import { DataAccess as DataAccessTypes } from '@requestnetwork/types';
import axios, { AxiosRequestConfig } from 'axios';

/**
 * Exposes a Data-Access module over HTTP
 */
export default class HttpDataAccess implements DataAccessTypes.IDataAccess {
  /**
   * Configuration that will be sent to axios for each request.
   * We can also create a AxiosInstance with axios.create() but it dramatically complicates testing.
   */
  private axiosConfig: AxiosRequestConfig;

  /**
   * Creates an instance of HttpDataAccess.
   * @param nodeConnectionConfig Configuration options to connect to the node. Follows Axios configuration format.
   */
  constructor(nodeConnectionConfig: AxiosRequestConfig = {}) {
    this.axiosConfig = Object.assign(
      {
        baseURL: 'http://localhost:3000',
      },
      nodeConnectionConfig,
    );
  }

  /**
   * Initialize the module. Does nothing, exists only to implement IDataAccess
   *
   * @returns nothing
   */
  public async initialize(): Promise<void> {
    // no-op, nothing to do
    return;
  }

  /**
   * Persists a new transaction on a node through HTTP.
   *
   * @param transactionData The transaction data
   * @param topics The topics used to index the transaction
   */
  public async persistTransaction(
    transactionData: DataAccessTypes.ITransaction,
    channelId: string,
    topics?: string[],
  ): Promise<DataAccessTypes.IReturnPersistTransaction> {
    const { data } = await axios.post(
      '/persistTransaction',
      {
        channelId,
        topics,
        transactionData,
      },
      this.axiosConfig,
    );
    return data;
  }

  /**
   * Gets the transactions for a topic from the node through HTTP.
   *
   * @param topic The topic to search for
   * @param timestampBoundaries filter timestamp boundaries
   */
  public async getTransactionsByTopic(
    topic: string,
    timestampBoundaries?: DataAccessTypes.ITimestampBoundaries,
  ): Promise<DataAccessTypes.IReturnGetTransactions> {
    const { data } = await axios.get(
      '/getTransactionsByTopic',
      Object.assign(this.axiosConfig, {
        params: { topic, timestampBoundaries },
      }),
    );
    return data;
  }

  /**
   * Gets the transactions for a channel from the node through HTTP.
   *
   * @param channelId The channel id to search for
   * @param timestampBoundaries filter timestamp boundaries
   */
  public async getTransactionsByChannelId(
    channelId: string,
    timestampBoundaries?: DataAccessTypes.ITimestampBoundaries,
  ): Promise<DataAccessTypes.IReturnGetTransactions> {
    const { data } = await axios.get(
      '/getTransactionsByChannelId',
      Object.assign(this.axiosConfig, {
        params: { channelId, timestampBoundaries },
      }),
    );
    return data;
  }

  /**
   * Gets all the transactions of channel indexed by topic from the node through HTTP.
   *
   * @param topic topic to search for
   * @param updatedBetween filter timestamp boundaries
   */
  public async getChannelsByTopic(
    topic: string,
    updatedBetween?: DataAccessTypes.ITimestampBoundaries,
  ): Promise<DataAccessTypes.IReturnGetChannelsByTopic> {
    const { data } = await axios.get(
      '/getChannelsByTopic',
      Object.assign(this.axiosConfig, {
        params: { topic, updatedBetween },
      }),
    );
    return data;
  }
}
