import { DataAccess } from '@requestnetwork/data-access';
import * as httpStatus from 'http-status-codes';

/**
 * Action to handle persistTransaction of data-access layer.
 */
export default {
  async actionPersistTransaction(
    clientRequest: any,
    serverResponse: any,
    dataAccess: DataAccess,
  ): Promise<void> {
    // Retrieves data access layer
    let dataAccessResponse;

    // Server accept json message
    clientRequest.accepts('json');

    // Verifies if data send from post are correct
    // clientRequest.body is expected to contain data for data-acces layer:
    // transactionData: data of the transaction
    // topics (optional): arbitrary strings that reference the transaction
    if (!clientRequest.body || !clientRequest.body.transactionData) {
      serverResponse.status(httpStatus.UNPROCESSABLE_ENTITY).send('Incorrect data');
    } else {
      try {
        dataAccessResponse = await dataAccess.persistTransaction(
          clientRequest.body.transactionData,
          clientRequest.body.topics,
        );

        serverResponse.status(httpStatus.OK).send(dataAccessResponse);
      } catch (e) {
        serverResponse.status(httpStatus.INTERNAL_SERVER_ERROR).send(e);
      }
    }
  },
};
