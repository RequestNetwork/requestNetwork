import { ClientTypes, DataAccessTypes } from '@requestnetwork/types';

import { EventEmitter } from 'events';
import httpConfigDefaults from './http-config-defaults';
import { normalizeKeccak256Hash, retry } from '@requestnetwork/utils';
import { stringify } from 'qs';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const packageJson = require('../package.json');

export type NodeConnectionConfig = { baseURL: string; headers: Record<string, string> };

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
   * Configuration that will be sent at each request.
   */
  protected nodeConnectionConfig: NodeConnectionConfig;

  /**
   * Creates an instance of HttpDataAccess.
   * @param httpConfig @see ClientTypes.IHttpDataAccessConfig for available options.
   * @param nodeConnectionConfig Configuration options to connect to the node.
   */
  constructor(
    {
      httpConfig,
      nodeConnectionConfig,
    }: {
      httpConfig?: Partial<ClientTypes.IHttpDataAccessConfig>;
      nodeConnectionConfig?: Partial<NodeConnectionConfig>;
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
    this.nodeConnectionConfig = {
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
    const data = await this.fetch<DataAccessTypes.IReturnPersistTransactionRaw>(
      'POST',
      '/persistTransaction',
      undefined,
      { channelId, topics, transactionData },
    );

    const transactionHash: string = normalizeKeccak256Hash(transactionData).value;

    // Create the return result with EventEmitter
    const result: DataAccessTypes.IReturnPersistTransaction = Object.assign(
      new EventEmitter() as DataAccessTypes.PersistTransactionEmitter,
      data,
    );

    // Try to get the confirmation
    new Promise((r) => setTimeout(r, this.httpConfig.getConfirmationDeferDelay))
      .then(async () => {
        const confirmedData =
          await this.fetchAndRetry<DataAccessTypes.IReturnPersistTransactionRaw>(
            '/getConfirmedTransaction',
            {
              transactionHash,
            },
            {
              maxRetries: this.httpConfig.getConfirmationMaxRetry,
              retryDelay: this.httpConfig.getConfirmationRetryDelay,
              exponentialBackoffDelay: this.httpConfig.getConfirmationExponentialBackoffDelay,
              maxExponentialBackoffDelay: this.httpConfig.getConfirmationMaxExponentialBackoffDelay,
            },
          );
        // when found, emit the event 'confirmed'
        result.emit('confirmed', confirmedData);
      })
      .catch((e) => {
        let error: Error = e;
        if (e.status === 404) {
          error = new Error(
            `Transaction confirmation not received. Try polling
          getTransactionsByChannelId() until the transaction is confirmed.
          deferDelay: ${this.httpConfig.getConfirmationDeferDelay}ms,
          maxRetries: ${this.httpConfig.getConfirmationMaxRetry},
          retryDelay: ${this.httpConfig.getConfirmationRetryDelay}ms,
          exponentialBackoffDelay: ${this.httpConfig.getConfirmationExponentialBackoffDelay}ms,
          maxExponentialBackoffDelay: ${this.httpConfig.getConfirmationMaxExponentialBackoffDelay}ms`,
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
    return this.fetchAndRetry('/getTransactionsByChannelId', {
      channelId,
      timestampBoundaries,
    });
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
    return this.fetchAndRetry('/getChannelsByTopic', {
      topic,
      updatedBetween,
    });
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
    return this.fetchAndRetry('/getChannelsByMultipleTopics', {
      topics,
      updatedBetween,
    });
  }

  /**
   * Gets information from the node (version, files etc...)
   *
   */
  public async _getStatus(): Promise<any> {
    return this.fetchAndRetry('/information', {});
  }

  /**
   * Sends an HTTP GET request to the node and retries until it succeeds.
   * Throws when the retry count reaches a maximum.
   *
   * @param url HTTP GET request url
   * @param params HTTP GET request parameters
   * @param retryConfig Maximum retry count, delay between retries, exponential backoff delay, and maximum exponential backoff delay
   */
  protected async fetchAndRetry<T = unknown>(
    path: string,
    params: Record<string, unknown>,
    retryConfig: {
      maxRetries?: number;
      retryDelay?: number;
      exponentialBackoffDelay?: number;
      maxExponentialBackoffDelay?: number;
    } = {},
  ): Promise<T> {
    retryConfig.maxRetries = retryConfig.maxRetries ?? this.httpConfig.httpRequestMaxRetry;
    retryConfig.retryDelay = retryConfig.retryDelay ?? this.httpConfig.httpRequestRetryDelay;
    retryConfig.exponentialBackoffDelay =
      retryConfig.exponentialBackoffDelay ?? this.httpConfig.httpRequestExponentialBackoffDelay;
    retryConfig.maxExponentialBackoffDelay =
      retryConfig.maxExponentialBackoffDelay ??
      this.httpConfig.httpRequestMaxExponentialBackoffDelay;
    return await retry(async () => await this.fetch<T>('GET', path, params), retryConfig)();
  }

  protected async fetch<T = unknown>(
    method: 'GET' | 'POST',
    path: string,
    params: unknown,
    body?: Record<string, unknown>,
  ): Promise<T> {
    const { baseURL, headers, ...options } = this.nodeConnectionConfig;
    const url = new URL(path, baseURL);
    url.search = stringify(params);
    const r = await fetch(url, {
      method,
      body: body ? JSON.stringify(body) : undefined,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
      ...options,
    });
    if (r.ok) {
      return await r.json();
    }

    throw Object.assign(new Error(r.statusText), {
      status: r.status,
      statusText: r.statusText,
    });
  }
}
