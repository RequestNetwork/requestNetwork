import { DataAccess as DataAccessTypes } from '@requestnetwork/types';
import axios, { AxiosRequestConfig } from 'axios';

/**
 * Exposes a Data-Access module over HTTP
 *
 * @export
 * @class HttpDataAccess
 * @implements {DataAccessTypes.IDataAccess}
 */
export default class HttpDataAccess implements DataAccessTypes.IDataAccess {
  /**
   * Configuration that will be sent to axios for each request.
   * We can also create a AxiosInstance with axios.create() but it dramatically complicates testing.
   *
   * @private
   * @type {AxiosRequestConfig}
   * @memberof HttpDataAccess
   */
  private axiosConfig: AxiosRequestConfig;

  /**
   * Creates an instance of HttpDataAccess.
   * @param {AxiosRequestConfig} [nodeConnectionConfig={}] Configuration options to connect to the node. Follows Axios configuration format.
   * @memberof HttpDataAccess
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
   * @returns {Promise<void>}
   * @memberof HttpDataAccess
   */
  public async initialize(): Promise<void> {
    // no-op, nothing to do
    return;
  }

  /**
   * Persists a new transaction on a node through HTTP.
   *
   * @param {string} transactionData
   * @param {string[]} [topics]
   * @returns {Promise<DataAccessTypes.IRequestDataReturnPersistTransaction>}
   * @memberof HttpDataAccess
   */
  public async persistTransaction(
    transactionData: DataAccessTypes.IRequestDataAccessTransaction,
    topics?: string[],
  ): Promise<DataAccessTypes.IRequestDataReturnPersistTransaction> {
    const { data } = await axios.post(
      '/persistTransaction',
      {
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
   * @param {string} topic
   * @returns {Promise<DataAccessTypes.IRequestDataReturnGetTransactionsByTopic>}
   * @memberof HttpDataAccess
   */
  public async getTransactionsByTopic(
    topic: string,
  ): Promise<DataAccessTypes.IRequestDataReturnGetTransactionsByTopic> {
    const { data } = await axios.get(
      '/getTransactionsByTopic',
      Object.assign(this.axiosConfig, {
        params: { topic },
      }),
    );
    return data;
  }
}
