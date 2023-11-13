import { DataAccessTypes, LogTypes } from '@requestnetwork/types';
import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';

export default class GetChannelHandler {
  constructor(
    private logger: LogTypes.ILogger,
    private dataAccess: DataAccessTypes.IDataRead,
  ) {
    this.handler = this.handler.bind(this);
  }

  /**
   * Handles getChannelsByTopic of data-access layer.
   *
   * @param clientRequest http client request object
   * @param serverResponse http server response object
   * @param dataAccess data access layer
   */
  async handler(clientRequest: Request, serverResponse: Response): Promise<void> {
    // Retrieves data access layer
    let transactions;

    const { updatedBetween, topic } = clientRequest.query;
    console.log(clientRequest.query);
    // Verifies if data sent from get request are correct
    // clientRequest.query is expected to contain the topic of the transactions to search for
    if (!topic || typeof topic !== 'string') {
      serverResponse.status(StatusCodes.UNPROCESSABLE_ENTITY).send('Incorrect data');
      return;
    }
    try {
      transactions = await this.dataAccess.getChannelsByTopic(
        topic,
        updatedBetween && typeof updatedBetween === 'string'
          ? JSON.parse(updatedBetween)
          : undefined,
      );

      serverResponse.status(StatusCodes.OK).send(transactions);
    } catch (e) {
      this.logger.error(`getChannelsByTopic error: ${e}`);

      serverResponse.status(StatusCodes.INTERNAL_SERVER_ERROR).send(e);
    }
  }
}
