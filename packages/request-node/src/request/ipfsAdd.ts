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
  constructor(
    private logger: LogTypes.ILogger,
    private ipfsStorage: StorageTypes.IIpfsStorage,
  ) {
    this.handler = this.handler.bind(this);
  }

  async handler(clientRequest: Request, serverResponse: Response): Promise<void> {
    // Retrieves data access layer
    let dataAccessResponse;

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

      // Set the timeout from the value from config and convert seconds to milliseconds
      /* eslint-disable no-magic-numbers */
      clientRequest.setTimeout(getPersistTransactionTimeout() * 1000, () => {
        this.logger.error(`ipfsAdd timeout. clientRequest.body.data: ${clientRequest.body.data}`, [
          'timeout',
        ]);
        serverResponse.status(StatusCodes.GATEWAY_TIMEOUT).send('ipfsAdd timeout');
      });

      try {
        dataAccessResponse = await this.ipfsStorage.ipfsAdd(
          JSON.stringify(clientRequest.body.data),
        );

        this.logger.debug(
          `ipfsAdd successfully completed ${JSON.stringify({
            ipfsHash: dataAccessResponse.ipfsHash,
            ipfsSize: dataAccessResponse.ipfsSize,
          })}`,
          ['metric', 'successRate'],
        );

        serverResponse.status(StatusCodes.OK).send(dataAccessResponse);
      } catch (e) {
        this.logger.error(
          `ipfsAdd fail  ${JSON.stringify({
            error: e,
            data: clientRequest.body.data,
          })}`,
        );

        serverResponse.status(StatusCodes.INTERNAL_SERVER_ERROR).send(e);
      }
    }
  }
}
