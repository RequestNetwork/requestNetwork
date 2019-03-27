import { DataAccess } from '@requestnetwork/data-access';
import * as httpStatus from 'http-status-codes';

const REQUEST_TIMEOUT: number = 600000;

/**
 * Handles getTransactionsByTopic of data-access layer.
 *
 * @param clientRequest http client request object
 * @param serverResponse http server response object
 * @param dataAccess data access layer
 */
export default async function getTransactionsByTopic(
  clientRequest: any,
  serverResponse: any,
  dataAccess: DataAccess,
): Promise<void> {
  // Retrieves data access layer
  let transactions;

  // As the Node doesn't implement a cache, all transactions have to be retrieved directly on IPFS
  // This operation can take a long time and then the timeout of the request should be increase
  // PROT-187: Decrease or remove this value
  clientRequest.setTimeout(REQUEST_TIMEOUT);

  // Verifies if data sent from get request are correct
  // clientRequest.query is expected to contain the topic of the transactions to search for
  if (!clientRequest.query || !clientRequest.query.topic) {
    serverResponse.status(httpStatus.UNPROCESSABLE_ENTITY).send('Incorrect data');
  } else {
    try {
      // parse updatedBetween because in query everything is string
      let timestampBoundaries: { from: number; to: number } | undefined;
      if (clientRequest.query.timestampBoundaries) {
        timestampBoundaries = JSON.parse(clientRequest.query.timestampBoundaries);
      }

      transactions = await dataAccess.getTransactionsByTopic(
        clientRequest.query.topic,
        timestampBoundaries,
      );

      serverResponse.status(httpStatus.OK).send(transactions);
    } catch (e) {
      // tslint:disable-next-line:no-console
      console.error(`getTransactionsByTopic error: ${e}`);

      serverResponse.status(httpStatus.INTERNAL_SERVER_ERROR).send(e);
    }
  }
}
