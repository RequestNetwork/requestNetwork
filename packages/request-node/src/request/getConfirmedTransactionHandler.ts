import { LogTypes } from '@requestnetwork/types';
import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import ConfirmedTransactionStore from './confirmedTransactionStore';

export default class getConfirmedTransactionHandler {
  constructor(private logger: LogTypes.ILogger, private store: ConfirmedTransactionStore) {
    this.handler = this.handler.bind(this);
  }

  /**
   * Returns the information of a confirmed transaction
   *
   * @param clientRequest http client request object
   * @param serverResponse http server response object
   **/
  public async handler(clientRequest: Request, serverResponse: Response): Promise<void> {
    try {
      const { transactionHash } = clientRequest.query;
      if (!transactionHash || typeof transactionHash !== 'string') {
        serverResponse
          .status(StatusCodes.UNPROCESSABLE_ENTITY)
          .send('transactionHash missing in the query');
        return;
      }
      const result = await this.store.getConfirmedTransaction(transactionHash);

      if (result) {
        serverResponse.status(StatusCodes.OK).send(result);
        return;
      }

      serverResponse.status(StatusCodes.NOT_FOUND).send();
    } catch (e) {
      this.logger.error(`getConfirmedTransaction error: ${e}`);
      this.logger.debug(`getConfirmedTransaction fail`, ['metric', 'successRate']);

      serverResponse.status(StatusCodes.INTERNAL_SERVER_ERROR).send(e);
    }
  }
}
