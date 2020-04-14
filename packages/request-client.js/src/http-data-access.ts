import { DataAccessTypes } from '@requestnetwork/types';
import Utils from '@requestnetwork/utils';
import axios, { AxiosRequestConfig } from 'axios';

import { EventEmitter } from 'events';

const packageJson = require('../package.json');

const REQUEST_CLIENT_VERSION_HEADER = 'X-Request-Network-Client-Version';

// Maximum number of retries to attempt when http requests to the Node fail
const HTTP_REQUEST_MAX_RETRY = 3;

// Delay between retry in ms
const HTTP_REQUEST_RETRY_DELAY = 100;

// Maximum number of retries to get the confirmation of a persistTransaction
const GET_CONFIRMATION_MAX_RETRY = 500;

// Delay between retry in ms to get the confirmation of a persistTransaction
const GET_CONFIRMATION_RETRY_DELAY = 3000;

/**
 * Exposes a Data-Access module over HTTP
 */
export default class HttpDataAccess implements DataAccessTypes.IDataAccess {
  /**
   * Configuration that will be sent to axios for each request.
   * We can also create a AxiosInstance with axios.create() but it dramatically complicates testing.
   */
  protected axiosConfig: AxiosRequestConfig;

  /**
   * Creates an instance of HttpDataAccess.
   * @param nodeConnectionConfig Configuration options to connect to the node. Follows Axios configuration format.
   */
  constructor(nodeConnectionConfig: AxiosRequestConfig = {}) {
    // Get Request Client version to set it in the header
    const requestClientVersion = packageJson.version;

    this.axiosConfig = Object.assign(
      {
        baseURL: 'http://localhost:3000',
        headers: {
          [REQUEST_CLIENT_VERSION_HEADER]: requestClientVersion,
        },
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
    Utils.retry(
      async () => {
        return axios.get(
          '/getConfirmedTransaction',
          Object.assign(this.axiosConfig, {
            params: { transactionHash },
          }),
        );
      },
      {
        maxRetries: GET_CONFIRMATION_MAX_RETRY,
        retryDelay: GET_CONFIRMATION_RETRY_DELAY,
      },
    )()
      .then((resultConfirmed: any) => {
        // when found, emit the event 'confirmed'
        result.emit('confirmed', resultConfirmed.data);
      })
      .catch((e: any) => {
        // tslint:disable-next-line:no-magic-numbers
        if (e.response.status === 404) {
          throw new Error(
            `Transaction confirmation not receive after ${GET_CONFIRMATION_MAX_RETRY} retries`,
          );
        } else {
          throw new Error(e.message);
        }
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
    const { data } = await Utils.retry(
      async () =>
        axios.get(
          '/getChannelsByMultipleTopics',
          Object.assign(this.axiosConfig, {
            params: { topics, updatedBetween },
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
   * Gets information from the node (version, files etc...)
   *
   * @param detailed if true get the list of files hashes
   */
  public async _getStatus(detailed?: boolean): Promise<any> {
    const { data } = await Utils.retry(
      async () =>
        axios.get(
          '/information',
          Object.assign(this.axiosConfig, {
            params: { detailed },
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
