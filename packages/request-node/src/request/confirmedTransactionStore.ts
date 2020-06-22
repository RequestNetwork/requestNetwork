import { DataAccessTypes, LogTypes } from '@requestnetwork/types';
import * as httpStatus from 'http-status-codes';

import * as Keyv from 'keyv';
import KeyvFile from 'keyv-file';

/**
 * Class for storing confirmed transactions information
 * When 'confirmed' event is receive from a 'persistTransaction', the event data are stored.
 * The client can call the getConfirmed entry point, to get the confirmed event.
 */
export default class ConfirmedTransactionStore {
  public store: Keyv<DataAccessTypes.IReturnPersistTransaction>;

  /**
   * Confirmed transactions store constructor
   */
  constructor(store?: KeyvFile) {
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
    clientRequest: any,
    serverResponse: any,
    logger: LogTypes.ILogger,
  ): Promise<void> {
    if (!clientRequest.query.transactionHash) {
      serverResponse
        .status(httpStatus.UNPROCESSABLE_ENTITY)
        .send('transactionHash missing in the query');
    } else {
      try {
        const result: DataAccessTypes.IReturnPersistTransaction | undefined = await this.store.get(
          clientRequest.query.transactionHash,
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
    await this.store.set(transactionHash, result);
  }
}
