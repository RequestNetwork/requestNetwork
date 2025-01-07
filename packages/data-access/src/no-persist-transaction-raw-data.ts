import { DataAccessTypes, StorageTypes } from '@requestnetwork/types';

export const getNoPersistTransactionRawData = (
  topics?: string[],
): DataAccessTypes.IReturnPersistTransactionRaw => {
  return {
    meta: {
      topics: topics || [],
      transactionStorageLocation: '',
      storageMeta: {
        state: StorageTypes.ContentState.PENDING,
        timestamp: Date.now() / 1000,
      },
    },
    result: {},
  };
};
