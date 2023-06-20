import { DataAccessTypes } from '@requestnetwork/types';
import { TheGraphDataAccess } from './data-access';

export class NoopDataWrite implements DataAccessTypes.IDataWrite {
  async initialize(): Promise<void> {
    // no-op
  }

  async close(): Promise<void> {
    // no-op
  }

  persistTransaction(): Promise<DataAccessTypes.IReturnPersistTransaction> {
    throw new Error(
      `cannot call persistTranscation without storage. Specify storage on ${TheGraphDataAccess.name}`,
    );
  }
}
