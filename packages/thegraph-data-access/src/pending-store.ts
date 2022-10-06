import { DataAccessTypes, StorageTypes } from '@requestnetwork/types';

type PendingItem = {
  transaction: DataAccessTypes.ITransaction;
  storageResult: StorageTypes.IAppendResult;
};
/**
 * A simple in-memory store to share state between DataReader and DataWriter
 * Useful to retrieve a transaction that was just emitted but is not confirmed yet
 **/
export class PendingStore {
  private pending: Record<string, PendingItem> = {};

  /** Gets a pending tx */
  public get(channelId: string): PendingItem {
    return this.pending[channelId];
  }

  public add(
    channelId: string,
    transaction: DataAccessTypes.ITransaction,
    storageResult: StorageTypes.IAppendResult,
  ): void {
    this.pending[channelId] = { transaction, storageResult };
  }

  public remove(channelId: string): void {
    delete this.pending[channelId];
  }
}
