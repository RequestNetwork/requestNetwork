import { DataAccessTypes } from '@requestnetwork/types';
import { HttpDataAccessConfig } from './http-data-access-config';
import { EventEmitter } from 'events';
import { HttpTransaction } from './http-transaction';

export class HttpDataWrite implements DataAccessTypes.IDataWrite {
  constructor(
    private readonly dataAccessConfig: HttpDataAccessConfig,
    private readonly transaction: HttpTransaction,
  ) {}

  /**
   * Initialize the module. Does nothing, exists only to implement IDataAccess
   *
   * @returns nothing
   */
  public async initialize(): Promise<void> {
    // no-op, nothing to do
    return;
  }

  /**
   * Closes the module. Does nothing, exists only to implement IDataAccess
   *
   * @returns nothing
   */
  public async close(): Promise<void> {
    // no-op, nothing to do
    return;
  }

  /**
   * Persists a new transaction on a node through HTTP.
   *
   * @param transactionData The transaction data
   * @param topics The topics used to index the transaction
   */
  public async persistTransaction(
    transactionData: DataAccessTypes.ITransaction,
    channelId: string,
    topics?: string[],
  ): Promise<DataAccessTypes.IReturnPersistTransaction> {
    const eventEmitter = new EventEmitter() as DataAccessTypes.PersistTransactionEmitter;

    // We don't retry this request since it may fail because of a slow Storage
    // For example, if the Ethereum network is slow and we retry the request three times
    // three data will be persisted at the end
    const data = await this.dataAccessConfig.fetch<DataAccessTypes.IReturnPersistTransactionRaw>(
      'POST',
      '/persistTransaction',
      undefined,
      { channelId, topics, transactionData },
    );

    // Create the return result with EventEmitter
    const result: DataAccessTypes.IReturnPersistTransaction = Object.assign(eventEmitter, data);

    // Try to get the confirmation
    new Promise((r) => setTimeout(r, this.dataAccessConfig.httpConfig.getConfirmationDeferDelay))
      .then(async () => {
        const confirmedData = await this.transaction.getConfirmedTransaction(transactionData);
        // when found, emit the event 'confirmed'
        result.emit('confirmed', confirmedData);
      })
      .catch((e) => {
        let error: Error = e;
        if (e && 'status' in e && e.status === 404) {
          error = new Error(
            `Timeout while confirming the Request was persisted. It is likely that the Request will be confirmed eventually. Catch this error and use getConfirmedTransaction() to continue polling for confirmation. Adjusting the httpConfig settings on the RequestNetwork object to avoid future timeouts. Avoid calling persistTransaction() again to prevent creating a duplicate Request.`,
          );
        }
        result.emit('error', error);
      });

    return result;
  }
}
