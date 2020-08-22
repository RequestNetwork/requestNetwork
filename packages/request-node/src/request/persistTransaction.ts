import { DataAccess } from '@requestnetwork/data-access';
import { LogTypes, MultiFormatTypes } from '@requestnetwork/types';
import Utils from '@requestnetwork/utils';
import * as httpStatus from 'http-status-codes';
import { getPersistTransactionTimeout } from '../config';

import ConfirmedTransactionStore from './confirmedTransactionStore';

/**
 * Class to persist transactions though the data-access layer
 */
export default class PersistTransaction {
  private confirmedTransactionStore: ConfirmedTransactionStore;

  /**
   * Persist transaction constructor
   */
  constructor(confirmedTransactionStore: ConfirmedTransactionStore) {
    this.confirmedTransactionStore = confirmedTransactionStore;
  }

  /**
   * Handles persistTransaction of data-access layer.
   *
   * @param clientRequest http client request object
   * @param serverResponse http server response object
   * @param dataAccess data access layer
   */
  public async persistTransaction(
    clientRequest: any,
    serverResponse: any,
    dataAccess: DataAccess,
    logger: LogTypes.ILogger,
  ): Promise<void> {
    // Retrieves data access layer
    let dataAccessResponse;

    // Used to compute request time
    const requestStartTime = Date.now();

    // Set the timeout from the value from config and convert seconds to milliseconds
    // tslint:disable:no-magic-numbers
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
      serverResponse.status(httpStatus.UNPROCESSABLE_ENTITY).send('Incorrect data');
    } else {
      try {
        const transactionHash: MultiFormatTypes.HashTypes.IHash = Utils.crypto.normalizeKeccak256Hash(
          clientRequest.body.transactionData,
        );

        logger.debug(
          `Persisting Transaction: ${JSON.stringify({
            channelId: clientRequest.body.channelId,
            topics: clientRequest.body.topics,
            transactionData: clientRequest.body.transactionData,
          })}`,
        );

        dataAccessResponse = await dataAccess.persistTransaction(
          clientRequest.body.transactionData,
          clientRequest.body.channelId,
          clientRequest.body.topics,
        );

        // when the transaction is confirmed, store the information to be serve when requested
        dataAccessResponse.on('confirmed', async dataAccessConfirmedResponse => {
          await this.confirmedTransactionStore.addConfirmedTransaction(
            transactionHash.value,
            dataAccessConfirmedResponse,
          );
          logger.info(`Transaction confirmed: ${transactionHash.value}`, ['metric', 'successRate']);
        });

        // when the transaction fails, log an error
        dataAccessResponse.on('error', async e => {
          const logData = [
            'transactionHash',
            transactionHash.value,
            'channelId',
            clientRequest.body.channelId,
            'topics',
            clientRequest.body.topics,
            'transactionData',
            JSON.stringify(clientRequest.body.transactionData),
          ].join('\n');

          logger.error(`persistTransaction error: ${e}. \n${logData}`);
        });

        // Log the request time
        const requestEndTime = Date.now();
        logger.debug(`persistTransaction latency: ${requestEndTime - requestStartTime}ms`, [
          'metric',
          'latency',
        ]);
        logger.debug(`persistTransaction successfully completed`, ['metric', 'successRate']);

        serverResponse.status(httpStatus.OK).send(dataAccessResponse);
      } catch (e) {
        logger.error(`persistTransaction error: ${e}`);
        logger.debug(`persistTransaction fail`, ['metric', 'successRate']);

        serverResponse.status(httpStatus.INTERNAL_SERVER_ERROR).send(e);
      }
    }
  }
}
