import { RequestLogic } from '@requestnetwork/request-logic';
import { AxiosRequestConfig } from 'axios';
import RequestNetwork from './api/request-network';
import HttpDataAccess from './http-data-access';

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
   * @param {AxiosRequestConfig} [nodeConnectionConfig={}] Configuration options to connect to the node. Follows Axios configuration format.
   * @memberof HttpRequestNetwork
   */
  constructor(nodeConnectionConfig: AxiosRequestConfig = {}) {
    const httpDataAccess = new HttpDataAccess(nodeConnectionConfig);

    const requestLogic = new RequestLogic(httpDataAccess);

    super(requestLogic);
  }
}
