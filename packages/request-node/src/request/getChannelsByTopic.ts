import { DataAccessTypes, LogTypes } from '@requestnetwork/types';
import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';

const GET_CHANNELS_TIMEOUT = 600000;
export default class GetChannelHandler {
  constructor(private logger: LogTypes.ILogger, private dataAccess: DataAccessTypes.IDataRead) {
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

    // Used to compute request time
    const requestStartTime = Date.now();

    // As the Node doesn't implement a cache, all transactions have to be retrieved directly on IPFS
    // This operation can take a long time and then the timeout of the request should be increase
    // PROT-187: Decrease or remove this value
    clientRequest.setTimeout(GET_CHANNELS_TIMEOUT);

    const { updatedBetween, topic } = clientRequest.query;
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

      // Log the request time
      const requestEndTime = Date.now();
      this.logger.debug(`getChannelsByTopic latency: ${requestEndTime - requestStartTime}ms`, [
        'metric',
        'latency',
      ]);

      serverResponse.status(StatusCodes.OK).send(transactions);
    } catch (e) {
      this.logger.error(`getChannelsByTopic error: ${e}`);

      serverResponse.status(StatusCodes.INTERNAL_SERVER_ERROR).send(e);
    }
  }
}
