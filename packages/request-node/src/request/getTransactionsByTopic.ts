import { DataAccess } from '@requestnetwork/data-access';
import * as httpStatus from 'http-status-codes';

/**
 * Action to handle getTransactionsByTopic of data-access layer.
 */
export default {
  async actionGetTransactionsByTopic(
    clientRequest: any,
    serverResponse: any,
    dataAccess: DataAccess,
  ): Promise<void> {
    // Retrieves data access layer
    let transactions;

    // Server accept json message
    clientRequest.accepts('json');

    // Verifies if data sent from get request are correct
    // clientRequest.query is expected to contain the topic of the transactions to search for
    if (!clientRequest.query || !clientRequest.query.topic) {
      serverResponse.status(httpStatus.UNPROCESSABLE_ENTITY).send('Incorrect data');
    } else {
      try {
        transactions = await dataAccess.getTransactionsByTopic(clientRequest.query.topic);

        serverResponse.status(httpStatus.OK).send(transactions);
      } catch (e) {
        serverResponse.status(httpStatus.INTERNAL_SERVER_ERROR).send(e);
      }
    }
  },
};
