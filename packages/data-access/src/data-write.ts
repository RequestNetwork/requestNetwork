import { EventEmitter } from 'events';
import Block from './block';
import { DataAccessTypes, StorageTypes } from '@requestnetwork/types';

export class DataAccessWrite implements DataAccessTypes.IDataWrite {
  constructor(
    protected readonly storage: StorageTypes.IStorageWrite,
    private readonly pendingStore?: DataAccessTypes.IPendingStore,
    public readonly persist: boolean = true,
  ) {
    this.pendingStore = pendingStore;
  }

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
    const updatedBlock = Block.pushTransaction(
      Block.createEmptyBlock(),
      transaction,
      channelId,
      topics,
    );

    const storageResult = await this.storage.append(JSON.stringify(updatedBlock));

    const eventEmitter = new EventEmitter() as DataAccessTypes.PersistTransactionEmitter;
    this.pendingStore?.add(channelId, { transaction, storageResult, topics: topics || [] });

    const result: DataAccessTypes.IReturnPersistTransactionRaw = {
      meta: {
        transactionStorageLocation: storageResult.id,
        storageMeta: storageResult.meta,
        topics: topics || [],
      },
      result: {},
    };
    storageResult.on('confirmed', (r) => {
      result.meta.storageMeta = r.meta;
      eventEmitter.emit('confirmed', result);
    });
    storageResult.on('error', (err) => eventEmitter.emit('error', err));

    return Object.assign(eventEmitter, result);
  }
}
