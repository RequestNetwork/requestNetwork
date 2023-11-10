import { EventEmitter } from 'events';

import { SubgraphClient } from './subgraph-client';
import { CombinedDataAccess, DataAccessWrite, DataAccessRead } from '@requestnetwork/data-access';
import { DataAccessTypes, LogTypes, StorageTypes } from '@requestnetwork/types';
import { retry, SimpleLogger } from '@requestnetwork/utils';
import { TheGraphDataAccessOptions } from './types';
import { NoopDataWrite } from './NoopDataWrite';

/**
 * A custom DataAccess to retrieve Request data from a TheGraph subgraph.
 * If no `storage` is passed, the data access is read-only.
 */
export class TheGraphDataAccess extends CombinedDataAccess {
  private logger: LogTypes.ILogger;
  constructor({ graphql, storage, ...options }: TheGraphDataAccessOptions) {
    const { url, ...rest } = graphql;
    const graphqlClient = new SubgraphClient(url, rest);

    const reader = new DataAccessRead(graphqlClient, options);
    const writer = storage
      ? new DataAccessWrite(storage, options.pendingStore)
      : new NoopDataWrite();

    super(reader, writer);

    this.logger = options.logger || new SimpleLogger();

    this.fetchConfirmedTransaction = retry(this.fetchConfirmedTransaction, {
      context: this,
      maxRetries: 30,
      retryDelay: 1000,
    });
  }

  /** intercept events so that confirmation is emitted only once the transaction is indexed */
  async persistTransaction(
    transactionData: DataAccessTypes.ITransaction,
    channelId: string,
    topics?: string[] | undefined,
  ): Promise<DataAccessTypes.IReturnPersistTransaction> {
    const eventEmitter = new EventEmitter() as DataAccessTypes.PersistTransactionEmitter;
    const result = await this.writer.persistTransaction(transactionData, channelId, topics);
    result.on('confirmed', (receipt) => {
      this.fetchConfirmedTransaction(channelId, receipt)
        .then((confirmedReceipt) => eventEmitter.emit('confirmed', confirmedReceipt))
        .catch(() => this.logger.warn(`Could not confirm channel ${channelId}`));
    });
    result.on('error', (e) => eventEmitter.emit('error', e));
    return Object.assign(eventEmitter, { meta: result.meta, result: result.result });
  }

  /**
   * We wait until the data is indexed on TheGraph
   **/
  private async fetchConfirmedTransaction(
    channelId: string,
    { meta, result }: DataAccessTypes.IReturnPersistTransactionRaw,
  ) {
    const transactions = await this.reader.getTransactionsByChannelId(channelId);
    if (
      transactions.result.transactions.some(
        (tx) =>
          tx.state === DataAccessTypes.TransactionState.PENDING &&
          // ignore transactions that were not included in the receipt being confirmed
          tx.transaction.hash &&
          meta.transactionStorageLocation.includes(tx.transaction.hash),
      )
    ) {
      throw new Error('not confirmed');
    }
    return {
      meta: {
        ...meta,
        storageMeta: meta.storageMeta
          ? {
              ...meta.storageMeta,
              state: StorageTypes.ContentState.CONFIRMED,
            }
          : undefined,
      },
      result,
    };
  }
}
