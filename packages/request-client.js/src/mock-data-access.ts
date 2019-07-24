import { DataAccess } from '@requestnetwork/data-access';
import { StorageTypes } from '@requestnetwork/types';

/**
 * Mock Data access that bypasses the initialization.
 * This class is meant to be used with HttpRequestNetwork and useMockStorage=true.
 * Data-access initialization is asynchronous and this class is a hack to avoid having an asynchronous operation in the HttpRequestNetwork constructor.
 */
export default class MockDataAccess extends DataAccess {
  constructor(storage: StorageTypes.IStorage) {
    super(storage);
    this.isInitialized = true;
  }
}
