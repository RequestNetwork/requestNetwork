import { DataAccess } from '@requestnetwork/data-access';
import { LogTypes, StorageTypes } from '@requestnetwork/types';
import * as httpStatus from 'http-status-codes';

const GET_CHANNELS_TIMEOUT: number = 600000;

/**
 * Handles getInformation of data-access layer.
 *
 * @param clientRequest http client request object
 * @param serverResponse http server response object
 * @param dataAccess data access layer
 */
export default async function getInformation(
  clientRequest: any,
  serverResponse: any,
  ethereumStorage: StorageTypes.IStorage,
  dataAccess: DataAccess,
  logger: LogTypes.ILogger,
): Promise<void> {
  // Used to compute request time
  const requestStartTime = Date.now();

  // As the Node doesn't implement a cache, all transactions have to be retrieved directly on IPFS
  // This operation can take a long time and then the timeout of the request should be increase
  // PROT-187: Decrease or remove this value
  clientRequest.setTimeout(GET_CHANNELS_TIMEOUT);

  if (!dataAccess._getInformation) {
    return serverResponse
      .status(httpStatus.INTERNAL_SERVER_ERROR)
      .send('The node do not support this feature');
  }

  try {
    const dataAccessInformation = await dataAccess._getInformation();
    const ethereumStorageInformation = await ethereumStorage._getInformation();

    const information = {
      dataAccessInformation,
      ethereumStorageInformation,
    };

    // Log the request time
    const requestEndTime = Date.now();
    logger.debug(`getInformation latency: ${requestEndTime - requestStartTime}ms`, [
      'metric',
      'latency',
    ]);

    serverResponse.status(httpStatus.OK).send(information);
  } catch (e) {
    logger.error(`getInformation error: ${e}`);

    serverResponse.status(httpStatus.INTERNAL_SERVER_ERROR).send(e);
  }
}
