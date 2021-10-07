import { Block } from '@requestnetwork/data-access';
import { LogTypes, StorageTypes } from '@requestnetwork/types';
import { Request, Response } from 'express';

import { StatusCodes } from 'http-status-codes';
import { getPersistTransactionTimeout } from '../config';

/**
 * Handles ipfsAdd of data-access layer.
 *
 * @param clientRequest http client request object
 * @param serverResponse http server response object
 * @param dataAccess data access layer
 */
export default class IpfsAddHandler {
  constructor(private logger: LogTypes.ILogger, private ethereumStorage: StorageTypes.IStorage) {
    this.handler = this.handler.bind(this);
  }

  async handler(clientRequest: Request, serverResponse: Response): Promise<void> {
    // Retrieves data access layer
    let dataAccessResponse;

    // Used to compute request time
    const requestStartTime = Date.now();

    // Set the timeout from the value from config and convert seconds to milliseconds
    /* eslint-disable no-magic-numbers */
    clientRequest.setTimeout(getPersistTransactionTimeout() * 1000);

    // Verifies if data send from post are correct
    // clientRequest.body is expected to contain data for data-acces layer:
    // transactionData: data of the transaction
    // topics (optional): arbitrary strings that reference the transaction
    if (!clientRequest.body || !clientRequest.body.data) {
      serverResponse.status(StatusCodes.BAD_REQUEST).send('Incorrect data');
    } else {
      try {
        // check that the data are actually a data-access block
        Block.parseBlock(clientRequest.body.data);
      } catch (error) {
        serverResponse.status(StatusCodes.BAD_REQUEST).send('data must be a block');
        return;
      }

      if (!this.ethereumStorage._ipfsAdd) {
        serverResponse
          .status(StatusCodes.INTERNAL_SERVER_ERROR)
          .send('The node do not support this feature');
        return;
      }

      try {
        dataAccessResponse = await this.ethereumStorage._ipfsAdd(
          JSON.stringify(clientRequest.body.data),
        );

        // Log the request time
        const requestEndTime = Date.now();
        this.logger.debug(`ipfsAdd latency: ${requestEndTime - requestStartTime}ms`, [
          'metric',
          'latency',
        ]);
        this.logger.debug(`ipfsAdd successfully completed`, ['metric', 'successRate']);

        serverResponse.status(StatusCodes.OK).send(dataAccessResponse);
      } catch (e) {
        this.logger.error(`ipfsAdd error: ${e}`);
        this.logger.debug(`ipfsAdd fail`, ['metric', 'successRate']);

        serverResponse.status(StatusCodes.INTERNAL_SERVER_ERROR).send(e);
      }
    }
  }
}
