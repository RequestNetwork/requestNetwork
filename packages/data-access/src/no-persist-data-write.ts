import { DataAccessTypes, StorageTypes } from '@requestnetwork/types';
import { EventEmitter } from 'events';

export class NoPersistDataWrite implements DataAccessTypes.IDataWrite {
  async initialize(): Promise<void> {
    return;
  }

  async close(): Promise<void> {
    return;
  }

  async persistTransaction(
    transaction: DataAccessTypes.ITransaction,
    channelId: string,
    topics?: string[] | undefined,
  ): Promise<DataAccessTypes.IReturnPersistTransaction> {
    const eventEmitter = new EventEmitter() as DataAccessTypes.PersistTransactionEmitter;

    const result: DataAccessTypes.IReturnPersistTransaction = Object.assign(eventEmitter, {
      meta: {
        topics: topics || [],
        transactionStorageLocation: '',
        storageMeta: {
          state: StorageTypes.ContentState.PENDING,
          timestamp: Date.now() / 1000,
        },
      },
      result: {},
    });

    // Emit confirmation instantly since data is not going to be persisted
    result.emit('confirmed', result);
    return result;
  }
}
