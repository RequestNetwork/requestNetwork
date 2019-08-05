import { DataAccess } from '@requestnetwork/data-access';
import { LogTypes } from '@requestnetwork/types';
import * as httpStatus from 'http-status-codes';
import { getPersistTransactionTimeout } from '../config';

/**
 * Handles persistTransaction of data-access layer.
 *
 * @param clientRequest http client request object
 * @param serverResponse http server response object
 * @param dataAccess data access layer
 */
export default async function persistTransaction(
  clientRequest: any,
  serverResponse: any,
  dataAccess: DataAccess,
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
  if (!clientRequest.body || !clientRequest.body.transactionData || !clientRequest.body.channelId) {
    serverResponse.status(httpStatus.UNPROCESSABLE_ENTITY).send('Incorrect data');
  } else {
    try {
      dataAccessResponse = await dataAccess.persistTransaction(
        clientRequest.body.transactionData,
        clientRequest.body.channelId,
        clientRequest.body.topics,
      );

      // Log the request time
      const requestEndTime = Date.now();
      logger.debug(`persistTransaction latency: ${requestEndTime - requestStartTime}ms`, ['metric', 'latency']);
      logger.debug(`persistTransaction successfully completed`, ['metric', 'successRate']);

      serverResponse.status(httpStatus.OK).send(dataAccessResponse);
    } catch (e) {
      logger.error(`persistTransaction error: ${e}`);
      logger.debug(`persistTransaction fail`, ['metric', 'successRate']);

      serverResponse.status(httpStatus.INTERNAL_SERVER_ERROR).send(e);
    }
  }
}
