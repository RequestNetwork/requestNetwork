import { ClientTypes, DataAccessTypes } from '@requestnetwork/types';
import Utils from '@requestnetwork/utils';
import axios, { AxiosRequestConfig } from 'axios';

import { EventEmitter } from 'events';
import httpConfigDefaults from './http-config-defaults';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const packageJson = require('../package.json');

/**
 * Exposes a Data-Access module over HTTP
 */
export default class HttpDataAccess implements DataAccessTypes.IDataAccess {
  /**
   * Configuration that overrides http-config-defaults,
   * @see httpConfigDefaults for the default configuration.
   */
  protected httpConfig: ClientTypes.IHttpDataAccessConfig;

  /**
   * Configuration that will be sent to axios for each request.
   * We can also create a AxiosInstance with axios.create() but it dramatically complicates testing.
   */
  protected axiosConfig: AxiosRequestConfig;

  /**
   * Creates an instance of HttpDataAccess.
   * @param httpConfig @see ClientTypes.IHttpDataAccessConfig for available options.
   * @param nodeConnectionConfig Configuration options to connect to the node. Follows Axios configuration format.
   */
  constructor(
    {
      httpConfig,
      nodeConnectionConfig,
    }: {
      httpConfig?: Partial<ClientTypes.IHttpDataAccessConfig>;
      nodeConnectionConfig?: AxiosRequestConfig;
    } = {
      httpConfig: {},
      nodeConnectionConfig: {},
    },
  ) {
    // Get Request Client version to set it in the header
    const requestClientVersion = packageJson.version;
    this.httpConfig = {
      ...httpConfigDefaults,
      ...httpConfig,
    };
    this.axiosConfig = {
      baseURL: 'http://localhost:3000',
      headers: {
        [this.httpConfig.requestClientVersionHeader]: requestClientVersion,
      },
      ...nodeConnectionConfig,
    };
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
   * Closes the module. Does nothing, exists only to implement IDataAccess
   *
   * @returns nothing
   */
  public async close(): Promise<void> {
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
    // We don't retry this request since it may fail because of a slow Storage
    // For example, if the Ethereum network is slow and we retry the request three times
    // three data will be persisted at the end
    const { data } = await axios.post(
      '/persistTransaction',
      {
        channelId,
        topics,
        transactionData,
      },
      this.axiosConfig,
    );

    const transactionHash: string = Utils.crypto.normalizeKeccak256Hash(transactionData).value;

    // Create the return result with EventEmitter
    const result: DataAccessTypes.IReturnPersistTransaction = Object.assign(
      new EventEmitter(),
      data,
    );

    // Try to get the confirmation
    new Promise((r) => setTimeout(r, this.httpConfig.getConfirmationDeferDelay))
      .then(async () => {
        const confirmedData = await this.fetchAndRetry(
          '/getConfirmedTransaction',
          {
            transactionHash,
          },
          {
            maxRetries: this.httpConfig.getConfirmationMaxRetry,
            retryDelay: this.httpConfig.getConfirmationRetryDelay,
          },
        );
        // when found, emit the event 'confirmed'
        result.emit('confirmed', confirmedData);
      })
      .catch((e) => {
        let error: Error = e;
        if (e.response.status === 404) {
          error = new Error(
            `Transaction confirmation not receive after ${this.httpConfig.getConfirmationMaxRetry} retries`,
          );
        }
        result.emit('error', error);
      });

    return result;
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
    return this.fetchAndRetry('/getTransactionsByChannelId', { channelId, timestampBoundaries });
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
    return this.fetchAndRetry('/getChannelsByTopic', { topic, updatedBetween });
  }

  /**
   * Gets all the transactions of channel indexed by multiple topics from the node through HTTP.
   *
   * @param topics topics to search for
   * @param updatedBetween filter timestamp boundaries
   */
  public async getChannelsByMultipleTopics(
    topics: string[],
    updatedBetween?: DataAccessTypes.ITimestampBoundaries,
  ): Promise<DataAccessTypes.IReturnGetChannelsByTopic> {
    return this.fetchAndRetry('/getChannelsByMultipleTopics', { topics, updatedBetween });
  }

  /**
   * Gets information from the node (version, files etc...)
   *
   * @param detailed if true get the list of files hashes
   */
  public async _getStatus(detailed?: boolean): Promise<any> {
    return this.fetchAndRetry('/information', { detailed });
  }

  /**
   * Sends an HTTP GET request to the node and retries until it succeeds.
   * Throws when the retry count reaches a maximum.
   *
   * @param url HTTP GET request url
   * @param params HTTP GET request parameters
   * @param retryConfig Maximum retry count and delay between retries
   */
  protected async fetchAndRetry(
    url: string,
    params: any,
    retryConfig: {
      maxRetries?: number;
      retryDelay?: number;
    } = {},
  ): Promise<any> {
    retryConfig.maxRetries = retryConfig.maxRetries ?? this.httpConfig.httpRequestMaxRetry;
    retryConfig.retryDelay = retryConfig.retryDelay ?? this.httpConfig.httpRequestRetryDelay;
    const { data } = await Utils.retry(
      async () => axios.get(url, { ...this.axiosConfig, params }),
      retryConfig,
    )();

    return data;
  }
}
