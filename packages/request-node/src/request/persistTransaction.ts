import { DataAccess } from '@requestnetwork/data-access';
import { LogTypes } from '@requestnetwork/types';
import * as httpStatus from 'http-status-codes';

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

      serverResponse.status(httpStatus.OK).send(dataAccessResponse);
    } catch (e) {
      logger.error(`persistTransaction error: ${e}`);

      serverResponse.status(httpStatus.INTERNAL_SERVER_ERROR).send(e);
    }
  }
}
