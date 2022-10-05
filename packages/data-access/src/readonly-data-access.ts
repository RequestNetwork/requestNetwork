import { DataAccessTypes } from 'types/dist';
import { CombinedDataAccess } from './combined-data-access';

class NoopDataWrite implements DataAccessTypes.IDataWrite {
  async initialize(): Promise<void> {
    // no-op
  }

  async close(): Promise<void> {
    // no-op
  }

  persistTransaction(): Promise<DataAccessTypes.IReturnPersistTransaction> {
    throw new Error(`Cannot call persistTransaction with ${ReadonlyDataAccess.name}`);
  }
}

/**
 * A data access for read only use cases.
 */
export class ReadonlyDataAccess extends CombinedDataAccess implements DataAccessTypes.IDataAccess {
  constructor(reader: DataAccessTypes.IDataRead) {
    super(reader, new NoopDataWrite());
  }
  async _getStatus(): Promise<any> {
    throw new Error('Not implemented');
  }
}
