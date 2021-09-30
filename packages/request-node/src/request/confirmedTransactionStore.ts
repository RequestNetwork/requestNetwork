import type { Request, Response } from 'express';
import { DataAccessTypes, LogTypes } from '@requestnetwork/types';
import { StatusCodes } from 'http-status-codes';

import Keyv, { Store } from 'keyv';

/**
 * Class for storing confirmed transactions information
 * When 'confirmed' event is receive from a 'persistTransaction', the event data are stored.
 * The client can call the getConfirmed entry point, to get the confirmed event.
 */
export default class ConfirmedTransactionStore {
  private store: Keyv<DataAccessTypes.IReturnPersistTransaction>;

  /**
   * Confirmed transactions store constructor
   */
  constructor(
    private logger: LogTypes.ILogger,
    store?: Store<DataAccessTypes.IReturnPersistTransaction>,
  ) {
    this.getConfirmedTransaction = this.getConfirmedTransaction.bind(this);

    this.store = new Keyv<DataAccessTypes.IReturnPersistTransaction>({
      namespace: 'ConfirmedTransactions',
      store,
    });
  }

  /**
   * Returns the information of a confirmed transaction
   *
   * @param clientRequest http client request object
   * @param serverResponse http server response object
   * @param logger logger
   */
  public async getConfirmedTransaction(
    clientRequest: Request,
    serverResponse: Response,
  ): Promise<void> {
    try {
      const { transactionHash } = clientRequest.query;
      if (!transactionHash || typeof transactionHash !== 'string') {
        serverResponse
          .status(StatusCodes.UNPROCESSABLE_ENTITY)
          .send('transactionHash missing in the query');
        return;
      }
      const result: DataAccessTypes.IReturnPersistTransaction | undefined = await this.store.get(
        transactionHash,
      );

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
    await this.store.set(transactionHash, result);
  }
}
