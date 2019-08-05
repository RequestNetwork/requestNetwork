import { DataAccess } from '@requestnetwork/data-access';
import { LogTypes } from '@requestnetwork/types';
import * as httpStatus from 'http-status-codes';

const GET_CHANNELS_TIMEOUT: number = 600000;

/**
 * Handles getChannelsByTopic of data-access layer.
 *
 * @param clientRequest http client request object
 * @param serverResponse http server response object
 * @param dataAccess data access layer
 */
export default async function getChannelsByTopic(
  clientRequest: any,
  serverResponse: any,
  dataAccess: DataAccess,
  logger: LogTypes.ILogger,
): Promise<void> {
  // Retrieves data access layer
  let transactions;

  // Used to compute request time
  const requestStartTime = Date.now();

  // As the Node doesn't implement a cache, all transactions have to be retrieved directly on IPFS
  // This operation can take a long time and then the timeout of the request should be increase
  // PROT-187: Decrease or remove this value
  clientRequest.setTimeout(GET_CHANNELS_TIMEOUT);

  // Verifies if data sent from get request are correct
  // clientRequest.query is expected to contain the topic of the transactions to search for
  if (!clientRequest.query || !clientRequest.query.topic) {
    serverResponse.status(httpStatus.UNPROCESSABLE_ENTITY).send('Incorrect data');
  } else {
    try {
      // parse updatedBetween because in query everything is string
      let updatedBetween: { from: number; to: number } | undefined;
      if (clientRequest.query.updatedBetween) {
        updatedBetween = JSON.parse(clientRequest.query.updatedBetween);
      }
      transactions = await dataAccess.getChannelsByTopic(clientRequest.query.topic, updatedBetween);

      // Log the request time
      const requestEndTime = Date.now();
      logger.debug(`getChannelsByTopic latency: ${requestEndTime - requestStartTime}ms`, ['metric', 'latency']);

      serverResponse.status(httpStatus.OK).send(transactions);
    } catch (e) {
      logger.error(`getChannelsByTopic error: ${e}`);

      serverResponse.status(httpStatus.INTERNAL_SERVER_ERROR).send(e);
    }
  }
}
