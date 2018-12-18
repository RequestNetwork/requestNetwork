import { RequestLogic } from '@requestnetwork/request-logic';
import RequestNetwork from './api/request-network';
import HttpDataAccess from './http-data-access';

/**
 * Exposes RequestNetwork module configured to use http-data-access
 *
 * @export
 * @class HttpRequestNetwork
 * @extends {RequestNetwork}
 */
export default class HttpRequestNetwork extends RequestNetwork {
  constructor() {
    const httpDataAccess = new HttpDataAccess();

    const requestLogic = new RequestLogic(httpDataAccess);

    super(requestLogic);
  }
}
