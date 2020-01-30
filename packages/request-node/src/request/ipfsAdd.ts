import { Block } from '@requestnetwork/data-access';
import { LogTypes, StorageTypes } from '@requestnetwork/types';

import * as httpStatus from 'http-status-codes';
import { getPersistTransactionTimeout } from '../config';

/**
 * Handles ipfsAdd of data-access layer.
 *
 * @param clientRequest http client request object
 * @param serverResponse http server response object
 * @param dataAccess data access layer
 */
export default async function ipfsAdd(
  clientRequest: any,
  serverResponse: any,
  ethereumStorage: StorageTypes.IStorage,
  logger: LogTypes.ILogger,
): Promise<void> {
  // Retrieves data access layer
  let dataAccessResponse;

  // Used to compute request time
  const requestStartTime = Date.now();

  // Set the timeout from the value from config and convert seconds to milliseconds
  // tslint:disable:no-magic-numbers
  clientRequest.setTimeout(getPersistTransactionTimeout() * 1000);

  // Verifies if data send from post are correct
  // clientRequest.body is expected to contain data for data-acces layer:
  // transactionData: data of the transaction
  // topics (optional): arbitrary strings that reference the transaction
  if (!clientRequest.body || !clientRequest.body.data) {
    serverResponse.status(httpStatus.BAD_REQUEST).send('Incorrect data');
  } else {
    try {
      // check that the data are actually a data-access block
      Block.parseBlock(clientRequest.body.data);
    } catch (error) {
      return serverResponse.status(httpStatus.BAD_REQUEST).send('data must be a block');
    }

    if (!ethereumStorage._ipfsAdd) {
      return serverResponse
        .status(httpStatus.INTERNAL_SERVER_ERROR)
        .send('The node do not support this feature');
    }

    try {
      dataAccessResponse = await ethereumStorage._ipfsAdd(JSON.stringify(clientRequest.body.data));

      // Log the request time
      const requestEndTime = Date.now();
      logger.debug(`ipfsAdd latency: ${requestEndTime - requestStartTime}ms`, [
        'metric',
        'latency',
      ]);
      logger.debug(`ipfsAdd successfully completed`, ['metric', 'successRate']);

      serverResponse.status(httpStatus.OK).send(dataAccessResponse);
    } catch (e) {
      logger.error(`ipfsAdd error: ${e}`);
      logger.debug(`ipfsAdd fail`, ['metric', 'successRate']);

      serverResponse.status(httpStatus.INTERNAL_SERVER_ERROR).send(e);
    }
  }
}
