import { RequestLogic } from '@requestnetwork/request-logic';
import { DataAccess as DataAccessTypes } from '@requestnetwork/types';
import { AxiosRequestConfig } from 'axios';
import RequestNetwork from './api/request-network';
import HttpDataAccess from './http-data-access';
import MockDataAccess from './mock-data-access';
import MockStorage from './mock-storage';

/**
 * Exposes RequestNetwork module configured to use http-data-access.
 *
 * @export
 * @class HttpRequestNetwork
 * @extends {RequestNetwork}
 */
export default class HttpRequestNetwork extends RequestNetwork {
  /**
   * Creates an instance of HttpRequestNetwork.
   * @param {AxiosRequestConfig} [options.nodeConnectionConfig={}] Configuration options to connect to the node. Follows Axios configuration format.
   * @param boolean [options.useMockStorage=false] When true, will use a mock storage in memory. Meant to simplify local development and should never be used in production.
   * @memberof HttpRequestNetwork
   */
  constructor(
    {
      nodeConnectionConfig,
      useMockStorage,
    }: { nodeConnectionConfig?: AxiosRequestConfig; useMockStorage?: boolean } = {
      nodeConnectionConfig: {},
      useMockStorage: false,
    },
  ) {
    // useMockStorage === true => use mock data-access
    // useMockStorage === false => use http data-access
    const dataAccess: DataAccessTypes.IDataAccess = useMockStorage
      ? new MockDataAccess(new MockStorage())
      : new HttpDataAccess(nodeConnectionConfig);

    const requestLogic = new RequestLogic(dataAccess);

    super(requestLogic);
  }
}
