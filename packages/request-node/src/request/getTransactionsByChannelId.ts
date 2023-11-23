import { DataAccessTypes, LogTypes } from '@requestnetwork/types';
import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';

export default class GetTransactionsByChannelIdHandler {
  constructor(private logger: LogTypes.ILogger, private dataAccess: DataAccessTypes.IDataRead) {
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

      serverResponse.status(StatusCodes.OK).send(transactions);
    } catch (e) {
      this.logger.error(`getTransactionsByChannelId error: ${e}`);

      serverResponse.status(StatusCodes.INTERNAL_SERVER_ERROR).send(e);
    }
  }
}
