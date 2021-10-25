import { DataAccess } from '@requestnetwork/data-access';
import { LogTypes } from '@requestnetwork/types';
import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';

const GET_TRANSACTIONS_TIMEOUT = 600000;

export default class GetTransactionsByChannelIdHandler {
  constructor(private logger: LogTypes.ILogger, private dataAccess: DataAccess) {
    this.handler = this.handler.bind(this);
  }

  /**
   * Handles getTransactionsByChannelId of data-access layer.
   *
   * @param clientRequest http client request object
   * @param serverResponse http server response object
   */
  async handler(clientRequest: Request, serverResponse: Response): Promise<void> {
    void clientRequest;
    void this.logger;
    void this.dataAccess;
    void GET_TRANSACTIONS_TIMEOUT;
    serverResponse.status(StatusCodes.INTERNAL_SERVER_ERROR).send('aaa');
    return;
  }
}
