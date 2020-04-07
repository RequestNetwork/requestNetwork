import { DataAccess } from '@requestnetwork/data-access';
import { LogTypes } from '@requestnetwork/types';
import * as httpStatus from 'http-status-codes';

const GET_CHANNELS_TIMEOUT: number = 600000;

/**
 * Handles getStatus of data-access layer.
 *
 * @param clientRequest http client request object
 * @param serverResponse http server response object
 * @param dataAccess data access layer
 */
export default async function getStatus(
  clientRequest: any,
  serverResponse: any,
  dataAccess: DataAccess,
  logger: LogTypes.ILogger,
): Promise<void> {
  // Used to compute request time
  const requestStartTime = Date.now();

  // As the Node doesn't implement a cache, all transactions have to be retrieved directly on IPFS
  // This operation can take a long time and then the timeout of the request should be increase
  // PROT-187: Decrease or remove this value
  clientRequest.setTimeout(GET_CHANNELS_TIMEOUT);

  if (!dataAccess._getStatus) {
    return serverResponse
      .status(httpStatus.INTERNAL_SERVER_ERROR)
      .send('The node do not support this feature');
  }

  try {
    const dataAccessStatus = await dataAccess._getStatus(clientRequest.query.detailed);

    const status = {
      dataAccess: dataAccessStatus,
      version: process.env.npm_package_version,
    };

    // Log the request time
    const requestEndTime = Date.now();
    logger.debug(`getStatus latency: ${requestEndTime - requestStartTime}ms`, [
      'metric',
      'latency',
    ]);

    serverResponse.status(httpStatus.OK).send(status);
  } catch (e) {
    logger.error(`getStatus error: ${e}`);

    serverResponse.status(httpStatus.INTERNAL_SERVER_ERROR).send(e);
  }
}
