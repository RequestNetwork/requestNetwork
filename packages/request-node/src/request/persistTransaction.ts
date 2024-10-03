import { LogTypes, MultiFormatTypes, DataAccessTypes } from '@requestnetwork/types';
import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { getPersistTransactionTimeout } from '../config';

import { normalizeKeccak256Hash } from '@requestnetwork/utils';

/**
 * Class to persist transactions though the data-access layer
 */
export default class PersistTransactionHandler {
  /**
   * Persist transaction constructor
   */
  constructor(
    private dataAccess: DataAccessTypes.IDataWrite,
    private logger: LogTypes.ILogger,
  ) {
    this.handler = this.handler.bind(this);
  }

  /**
   * Handles persistTransaction of data-access layer.
   *
   * @param clientRequest http client request object
   * @param serverResponse http server response object
   * @param dataAccess data access layer
   */
  public async handler(clientRequest: Request, serverResponse: Response): Promise<void> {
    // Retrieves data access layer
    let dataAccessResponse: DataAccessTypes.IReturnPersistTransaction;

    // Verifies if data send from post are correct
    // clientRequest.body is expected to contain data for data-acces layer:
    // transactionData: data of the transaction
    // topics (optional): arbitrary strings that reference the transaction
    if (
      !clientRequest.body ||
      !clientRequest.body.transactionData ||
      !clientRequest.body.channelId
    ) {
      serverResponse.status(StatusCodes.UNPROCESSABLE_ENTITY).send('Incorrect data');
      return;
    }

    const transactionHash: MultiFormatTypes.HashTypes.IHash = normalizeKeccak256Hash(
      clientRequest.body.transactionData,
    );

    // Set the timeout from the value from config and convert seconds to milliseconds
    /* eslint-disable no-magic-numbers */
    clientRequest.setTimeout(getPersistTransactionTimeout() * 1000, () => {
      this.logger.error(
        `persistTransaction timeout ${JSON.stringify({
          transactionHash,
          channelId: clientRequest.body.channelId,
        })}`,
        ['timeout'],
      );
      serverResponse.status(StatusCodes.GATEWAY_TIMEOUT).send('persistTransaction timeout');
    });

    try {
      this.logger.debug(
        `Persisting Transaction: ${JSON.stringify({
          transactionHash,
          channelId: clientRequest.body.channelId,
          topics: clientRequest.body.topics,
          transactionData: clientRequest.body.transactionData,
        })}`,
      );

      dataAccessResponse = await this.dataAccess.persistTransaction(
        clientRequest.body.transactionData,
        clientRequest.body.channelId,
        clientRequest.body.topics,
      );

      dataAccessResponse.on('confirmed', async () => {
        this.logger.info(
          `Transaction confirmed: ${JSON.stringify({
            transactionHash,
            channelId: clientRequest.body.channelId,
          })}`,
          ['metric', 'successRate'],
        );
      });

      // when the transaction fails, log an error
      dataAccessResponse.on('error', async (e: unknown) => {
        this.logger.error(`persistTransaction error: ${e}\n
          transactionHash: ${transactionHash.value}, channelId: ${
            clientRequest.body.channelId
          }, topics: ${clientRequest.body.topics}, transactionData: ${JSON.stringify(
            clientRequest.body.transactionData,
          )}`);
      });

      this.logger.debug(
        `persistTransaction successfully completed ${JSON.stringify({
          transactionHash,
          channelId: clientRequest.body.channelId,
        })}`,
        ['metric', 'successRate'],
      );

      serverResponse.status(StatusCodes.OK).send(dataAccessResponse);
    } catch (e) {
      this.logger.error(
        `persistTransaction fail ${JSON.stringify({
          error: e,
          transactionHash,
          channelId: clientRequest.body.channelId,
          topics: clientRequest.body.topics,
          transactionData: clientRequest.body.transactionData,
        })}`,
      );

      serverResponse.status(StatusCodes.INTERNAL_SERVER_ERROR).send(e);
    }
  }
}
