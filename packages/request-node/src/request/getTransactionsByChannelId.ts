import { DataAccessTypes, LogTypes } from '@requestnetwork/types';
import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';

const GET_TRANSACTIONS_TIMEOUT = 600000;

export default class GetTransactionsByChannelIdHandler {
  constructor(private logger: LogTypes.ILogger, private dataAccess: DataAccessTypes.IDataAccess) {
    this.handler = this.handler.bind(this);
  }

  /**
   * Handles getTransactionsByChannelId of data-access layer.
   *
   * @param clientRequest http client request object
   * @param serverResponse http server response object
   */
  async handler(clientRequest: Request, serverResponse: Response): Promise<void> {
    // Retrieves data access layer
    let transactions;

    // Used to compute request time
    const requestStartTime = Date.now();

    // As the Node doesn't implement a cache, all transactions have to be retrieved directly on IPFS
    // This operation can take a long time and then the timeout of the request should be increase
    // PROT-187: Decrease or remove this value
    clientRequest.setTimeout(GET_TRANSACTIONS_TIMEOUT);

    const { channelId, timestampBoundaries } = clientRequest.query;

    // Verifies if data sent from get request are correct
    // clientRequest.query is expected to contain the channelId of the transactions to search for
    if (!channelId || typeof channelId !== 'string') {
      serverResponse.status(StatusCodes.UNPROCESSABLE_ENTITY).send('Incorrect data');
      return;
    }
    try {
      transactions = await this.dataAccess.getTransactionsByChannelId(
        channelId,
        timestampBoundaries && typeof timestampBoundaries === 'string'
          ? JSON.parse(timestampBoundaries)
          : undefined,
      );

      // Log the request time
      const requestEndTime = Date.now();
      this.logger.debug(
        `getTransactionsByChannelId latency: ${requestEndTime - requestStartTime}ms`,
        ['metric', 'latency'],
      );

      serverResponse.status(StatusCodes.OK).send(transactions);
    } catch (e) {
      this.logger.error(`getTransactionsByChannelId error: ${e}`);

      serverResponse.status(StatusCodes.INTERNAL_SERVER_ERROR).send(e);
    }
  }
}
