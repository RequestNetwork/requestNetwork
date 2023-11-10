import { LogTypes, MultiFormatTypes, DataAccessTypes } from '@requestnetwork/types';
import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { getPersistTransactionTimeout } from '../config';

import ConfirmedTransactionStore from './confirmedTransactionStore';
import { normalizeKeccak256Hash } from '@requestnetwork/utils';

/**
 * Class to persist transactions though the data-access layer
 */
export default class PersistTransactionHandler {
  /**
   * Persist transaction constructor
   */
  constructor(
    private confirmedTransactionStore: ConfirmedTransactionStore,
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

    // Used to compute request time
    const requestStartTime = Date.now();

    // Set the timeout from the value from config and convert seconds to milliseconds
    /* eslint-disable no-magic-numbers */
    clientRequest.setTimeout(getPersistTransactionTimeout() * 1000);

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
    try {
      const transactionHash: MultiFormatTypes.HashTypes.IHash = normalizeKeccak256Hash(
        clientRequest.body.transactionData,
      );

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

      // when the transaction is confirmed, store the information to be served when requested
      dataAccessResponse.on('confirmed', async (dataAccessConfirmedResponse) => {
        await this.confirmedTransactionStore.addConfirmedTransaction(
          transactionHash.value,
          dataAccessConfirmedResponse,
        );
        this.logger.info(`Transaction confirmed: ${transactionHash.value}`, [
          'metric',
          'successRate',
        ]);
      });

      // when the transaction fails, log an error
      dataAccessResponse.on('error', async (e: unknown) => {
        await this.confirmedTransactionStore.addFailedTransaction(
          transactionHash.value,
          e as Error,
        );
        this.logger.error(`persistTransaction error: ${e}\n
          transactionHash: ${transactionHash.value}, channelId: ${
          clientRequest.body.channelId
        }, topics: ${clientRequest.body.topics}, transactionData: ${JSON.stringify(
          clientRequest.body.transactionData,
        )}`);
      });

      // Log the request time
      const requestEndTime = Date.now();
      this.logger.debug(`persistTransaction latency: ${requestEndTime - requestStartTime}ms`, [
        'metric',
        'latency',
      ]);
      this.logger.debug(`persistTransaction successfully completed`, ['metric', 'successRate']);

      serverResponse.status(StatusCodes.OK).send(dataAccessResponse);
    } catch (e) {
      this.logger.error(`persistTransaction error: ${e}`);
      this.logger.debug(`persistTransaction fail`, ['metric', 'successRate']);

      serverResponse.status(StatusCodes.INTERNAL_SERVER_ERROR).send(e);
    }
  }
}
