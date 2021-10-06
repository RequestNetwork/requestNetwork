import { DataAccessTypes } from '@requestnetwork/types';
import Utils from '@requestnetwork/utils';
import axios, { AxiosRequestConfig } from 'axios';

import { EventEmitter } from 'events';
import constants from './constants';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const packageJson = require('../package.json');

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
          [constants.REQUEST_CLIENT_VERSION_HEADER]: requestClientVersion,
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
    setTimeout(
      () =>
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
            maxRetries: constants.GET_CONFIRMATION_MAX_RETRY,
            retryDelay: constants.GET_CONFIRMATION_RETRY_DELAY,
          },
        )()
          .then((resultConfirmed: any) => {
            // when found, emit the event 'confirmed'
            result.emit('confirmed', resultConfirmed.data);
          })
          .catch((e: any) => {
            // eslint-disable-next-line no-magic-numbers
            if (e.response.status === 404) {
              throw new Error(
                `Transaction confirmation not receive after ${constants.GET_CONFIRMATION_MAX_RETRY} retries`,
              );
            } else {
              throw new Error(e.message);
            }
          }),
      constants.GET_CONFIRMATION_RETRY_DELAY,
    );

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
   */
  protected async fetchAndRetry(url: string, params: any): Promise<any> {
    const { data } = await Utils.retry(
      async () => axios.get(url, { ...this.axiosConfig, params }),
      {
        maxRetries: constants.HTTP_REQUEST_MAX_RETRY,
        retryDelay: constants.HTTP_REQUEST_RETRY_DELAY,
      },
    )();

    return data;
  }
}
