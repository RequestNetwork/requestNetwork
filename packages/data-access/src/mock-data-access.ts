import { DataAccessTypes, StorageTypes } from '@requestnetwork/types';
import { DataAccessWrite } from './data-write';
import { DataAccessRead } from './data-read';
import { PendingStore } from './pending-store';
import { InMemoryIndexer } from './in-memory-indexer';
import { CombinedDataAccess } from './combined-data-access';

/**
 * Mock Data access that bypasses the initialization.
 * This class is meant to be used with HttpRequestNetwork and useMockStorage=true.
 * Data-access initialization is asynchronous and this class is a hack to avoid having an asynchronous operation in the HttpRequestNetwork constructor.
 */
export class MockDataAccess extends CombinedDataAccess {
  private readonly dataIndex: InMemoryIndexer;

  constructor(storage: StorageTypes.IStorage, options: { persist: boolean } = { persist: true }) {
    const dataIndex = new InMemoryIndexer(storage);
    const pendingStore = new PendingStore();

    super(
      new DataAccessRead(dataIndex, { network: 'mock', pendingStore }),
      new DataAccessWrite(storage, pendingStore, options.persist),
    );
    this.dataIndex = dataIndex;
  }

  persistTransaction = async (
    transactionData: DataAccessTypes.ITransaction,
    channelId: string,
    topics?: string[] | undefined,
  ): Promise<DataAccessTypes.IReturnPersistTransaction> => {
    const result = await this.writer.persistTransaction(transactionData, channelId, topics);
    this.dataIndex.addIndex(channelId, topics || [], result.meta.transactionStorageLocation);
    return result;
  };
}
