import { DataAccessTypes } from '@requestnetwork/types';
import Utils from '@requestnetwork/utils';
import axios, { AxiosRequestConfig } from 'axios';

// Maximum number of retries to attempt when http requests to the Node fail
const HTTP_REQUEST_MAX_RETRY = 3;

// Delay between retry in ms
const HTTP_REQUEST_RETRY_DELAY = 100;

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
    const { data } = await Utils.retry(
      async () =>
        axios.post(
          '/persistTransaction',
          {
            channelId,
            topics,
            transactionData,
          },
          this.axiosConfig,
        ),
      {
        maxRetries: HTTP_REQUEST_MAX_RETRY,
        retryDelay: HTTP_REQUEST_RETRY_DELAY,
      },
    )();

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
    const { data } = await Utils.retry(
      async () =>
        axios.get(
          '/getTransactionsByChannelId',
          Object.assign(this.axiosConfig, {
            params: { channelId, timestampBoundaries },
          }),
        ),
      {
        maxRetries: HTTP_REQUEST_MAX_RETRY,
        retryDelay: HTTP_REQUEST_RETRY_DELAY,
      },
    )();

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
    const { data } = await Utils.retry(
      async () =>
        axios.get(
          '/getChannelsByTopic',
          Object.assign(this.axiosConfig, {
            params: { topic, updatedBetween },
          }),
        ),
      {
        maxRetries: HTTP_REQUEST_MAX_RETRY,
        retryDelay: HTTP_REQUEST_RETRY_DELAY,
      },
    )();

    return data;
  }
}
