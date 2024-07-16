import HttpDataAccess, { NodeConnectionConfig } from './http-data-access';
import { ClientTypes, DataAccessTypes, StorageTypes } from '@requestnetwork/types';
import { EventEmitter } from 'events';

export class NoPersistHttpDataAccess extends HttpDataAccess {
  constructor(
    {
      httpConfig,
      nodeConnectionConfig,
    }: {
      httpConfig?: Partial<ClientTypes.IHttpDataAccessConfig>;
      nodeConnectionConfig?: Partial<NodeConnectionConfig>;
    } = {
      httpConfig: {},
      nodeConnectionConfig: {},
    },
  ) {
    super({ httpConfig, nodeConnectionConfig });
  }

  async persistTransaction(
    transactionData: DataAccessTypes.ITransaction,
    channelId: string,
    topics?: string[],
  ): Promise<DataAccessTypes.IReturnPersistTransaction> {
    const data: DataAccessTypes.IReturnPersistTransactionRaw = {
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

    const result: DataAccessTypes.IReturnPersistTransaction = Object.assign(
      new EventEmitter() as DataAccessTypes.PersistTransactionEmitter,
      data,
    );

    result.emit('confirmed', result);

    return result;
  }
}
