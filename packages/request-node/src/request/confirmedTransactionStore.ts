import { DataAccessTypes, LogTypes } from '@requestnetwork/types';
import * as httpStatus from 'http-status-codes';

import * as Keyv from 'keyv';

/**
 * Class for storing confirmed transaction information
 * This class allow to store and serve the information when a transaction is confirmed
 */
export default class ConfirmedTransactionStore {
  public store: Keyv<DataAccessTypes.IReturnPersistTransaction>;

  /**
   * Confirmed transaction store constructor
   */
  constructor() {
    this.store = new Keyv<DataAccessTypes.IReturnPersistTransaction>();
  }

  /**
   * Returns the information of a confirmed transaction
   *
   * @param clientRequest http client request object
   * @param serverResponse http server response object
   * @param logger logger
   */
  public async getConfirmedTransaction(
    clientRequest: any,
    serverResponse: any,
    logger: LogTypes.ILogger,
  ): Promise<void> {
    if (!clientRequest.body.transactionHash) {
      serverResponse.status(httpStatus.UNPROCESSABLE_ENTITY).send('Incorrect data');
    } else {
      try {
        const result: DataAccessTypes.IReturnPersistTransaction | undefined = await this.store.get(
          clientRequest.body.transactionHash,
        );

        if (result) {
          return serverResponse.status(httpStatus.OK).send(result);
        }

        return serverResponse.status(httpStatus.NOT_FOUND).send();
      } catch (e) {
        logger.error(`getConfirmedTransaction error: ${e}`);
        logger.debug(`getConfirmedTransaction fail`, ['metric', 'successRate']);

        serverResponse.status(httpStatus.INTERNAL_SERVER_ERROR).send(e);
      }
    }
  }

  /**
   * Stores the result of a transaction confirmation
   *
   * @param transactionHash hash of the transaction
   * @param result result of the event "confirmed"
   */
  public async addConfirmedTransaction(
    transactionHash: string,
    result: DataAccessTypes.IReturnPersistTransaction,
  ): Promise<void> {
    this.store.set(transactionHash, result);
  }
}
