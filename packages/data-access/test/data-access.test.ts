/* eslint-disable spellcheck/spell-checker */
import { EventEmitter } from 'events';

import { DataAccessTypes, StorageTypes } from '@requestnetwork/types';

import RequestDataAccessBlock from '../src/block';
import DataAccess from '../src/data-access';

// We use this function to flush the call stack
// If we don't use this function, the fake timer will be increased before the interval function being called
const flushCallStack = (): Promise<any> => {
  return new Promise((resolve): any => {
    setTimeout(resolve, 0);
    jest.advanceTimersByTime(1);
  });
};

const transactionDataMock1String = JSON.stringify({
  attribut1: 'plop',
  attribut2: 'value',
});
const transactionDataMock2String = JSON.stringify({
  attribut1: 'foo',
  attribut2: 'bar',
});
const transactionDataMock3String = JSON.stringify({
  attribut1: 'jean',
  attribut2: 'bon',
});

const transactionMock1: DataAccessTypes.ITransaction = {
  data: transactionDataMock1String,
};
const transactionMock2: DataAccessTypes.ITransaction = {
  data: transactionDataMock2String,
};
const transactionMock3: DataAccessTypes.ITransaction = {
  data: transactionDataMock3String,
};

const arbitraryId1 = '011111111111111111111111111111111111111111111111111111111111111111';
const arbitraryId2 = '012222222222222222222222222222222222222222222222222222222222222222';

const arbitraryTopic1 = '01aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
const arbitraryTopic2 = '01cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc';

const emptyblock = RequestDataAccessBlock.createEmptyBlock();
const blockWith1tx = RequestDataAccessBlock.pushTransaction(
  emptyblock,
  transactionMock1,
  arbitraryId1,
  [arbitraryTopic1, arbitraryTopic2],
);
const blockWith2tx = RequestDataAccessBlock.pushTransaction(
  blockWith1tx,
  transactionMock2,
  arbitraryId2,
  [arbitraryTopic2],
);

const blockWith1txBis = RequestDataAccessBlock.pushTransaction(
  emptyblock,
  transactionMock3,
  arbitraryId1,
  [arbitraryTopic1],
);

const dataIdBlock2tx = 'dataIdBlock2tx';

const getDataResult: StorageTypes.IEntriesWithLastTimestamp = {
  entries: [
    {
      content: JSON.stringify(blockWith2tx),
      id: dataIdBlock2tx,
      meta: { state: StorageTypes.ContentState.CONFIRMED, timestamp: 10 },
    },
  ],
  lastTimestamp: 0,
};

const dataIdBlock1txBis = 'dataIdBlock1txBis';
const getIgnoredDataResult: StorageTypes.IEntry[] = [
  {
    content: JSON.stringify(blockWith1txBis),
    id: dataIdBlock1txBis,
    meta: { state: StorageTypes.ContentState.CONFIRMED, timestamp: 1 },
  },
];

const appendResult: any = {
  content: '',
  id: dataIdBlock2tx,
  meta: {
    state: StorageTypes.ContentState.PENDING,
    timestamp: 1,
  },
};

const appendResultConfirmed = {
  content: '',
  id: dataIdBlock2tx,
  meta: {
    state: StorageTypes.ContentState.CONFIRMED,
    timestamp: 1,
  },
};

const emptyDataResult: StorageTypes.IEntriesWithLastTimestamp = {
  entries: [],
  lastTimestamp: 0,
};

const defaultTestData: Promise<StorageTypes.IEntriesWithLastTimestamp> = Promise.resolve(
  getDataResult,
);

const defaultFakeStorage: StorageTypes.IStorage = {
  _getStatus: jest.fn((): any => ({
    fake: 'status',
  })),
  _ipfsAdd: jest.fn(),
  append: jest.fn((): any => {
    const appendResultWithEvent = Object.assign(new EventEmitter(), appendResult);
    setTimeout(
      () => {
        appendResultWithEvent.emit('confirmed', appendResultConfirmed);
      },
      // tslint:disable-next-line:no-magic-numbers
      10,
    );
    return appendResultWithEvent;
  }),
  getData: (): Promise<StorageTypes.IEntriesWithLastTimestamp> => defaultTestData,
  getIgnoredData: async (): Promise<StorageTypes.IEntry[]> => [],
  initialize: jest.fn(),
  read: (param: string): any => {
    const dataIdBlock2txFake: any = {
      meta: {},
    };
    const result: any = {
      dataIdBlock2tx: dataIdBlock2txFake,
    };
    return result[param];
  },
  readMany(params: string[]): Promise<any[]> {
    return Promise.all(params.map(this.read));
  },
};

// tslint:disable:no-magic-numbers
/* tslint:disable:no-unused-expression */
describe('data-access', () => {
  let testContext: any;

  beforeEach(() => {
    testContext = {};
  });

  beforeEach(async () => {
    jest.useFakeTimers('modern');
  });

  // afterEach(async () => {
  //   sinon.restore();
  // });

  describe('constructor', () => {
    it('cannot initialize with getData without result', async () => {
      const customFakeStorage = {
        ...defaultFakeStorage,
        getData: (): Promise<StorageTypes.IEntriesWithLastTimestamp> =>
          Promise.resolve({
            lastTimestamp: 0,
          } as any),
      };

      const dataAccess = new DataAccess(customFakeStorage);

      await expect(dataAccess.initialize()).rejects.toThrowError(
        'data from storage do not follow the standard',
      );
    });

    it('cannot initialize twice', async () => {
      const dataAccess = new DataAccess(defaultFakeStorage);
      await dataAccess.initialize();

      await expect(dataAccess.initialize()).rejects.toThrowError('already initialized');
    });

    it('cannot getChannelsByTopic if not initialized', async () => {
      const fakeStorage = {
        ...defaultFakeStorage,
        read: (param: string): any => {
          const dataIdBlock2txFake: StorageTypes.IEntry = {
            content: JSON.stringify(blockWith2tx),
            id: '1',
            meta: { state: StorageTypes.ContentState.CONFIRMED, timestamp: 1 },
          };
          const result: any = {
            dataIdBlock2tx: dataIdBlock2txFake,
          };
          return result[param];
        },
      };

      const dataAccess = new DataAccess(fakeStorage);

      await expect(dataAccess.getChannelsByTopic(arbitraryTopic1)).rejects.toThrowError(
        'DataAccess must be initialized',
      );
    });
  });

  describe('getTransactionsByChannelId', () => {
    let dataAccess: any;

    beforeEach(async () => {
      const fakeStorage = {
        ...defaultFakeStorage,
        read: (param: string): any => {
          const dataIdBlock2txFake: StorageTypes.IEntry = {
            content: JSON.stringify(blockWith2tx),
            id: '1',
            meta: { state: StorageTypes.ContentState.CONFIRMED, timestamp: 10 },
          };
          const result: any = {
            dataIdBlock2tx: dataIdBlock2txFake,
          };
          return result[param];
        },
      };

      dataAccess = new DataAccess(fakeStorage);
      await dataAccess.initialize();
    });

    it('can getTransactionsByChannelId() with boundaries', async () => {
      expect(
        await dataAccess.getTransactionsByChannelId(arbitraryId1, { from: 9, to: 100 }),
      ).toMatchObject({
        meta: {
          storageMeta: [
            {
              state: DataAccessTypes.TransactionState.CONFIRMED,
              timestamp: 10,
            },
          ],
          transactionsStorageLocation: [dataIdBlock2tx],
        },
        result: {
          transactions: [
            {
              state: DataAccessTypes.TransactionState.CONFIRMED,
              timestamp: 10,
              transaction: transactionMock1,
            },
          ],
        },
      });
    });

    it('can getTransactionsByChannelId() with boundaries too restrictive', async () => {
      expect(
        await dataAccess.getTransactionsByChannelId(arbitraryId1, { from: 11, to: 100 }),
      ).toMatchObject({
        meta: {
          storageMeta: [],
          transactionsStorageLocation: [],
        },
        result: { transactions: [] },
      });
    });
  });

  describe('getChannelByTopic', () => {
    let dataAccess: any;

    beforeEach(async () => {
      const fakeStorage = {
        ...defaultFakeStorage,
        read: (param: string): any => {
          const dataIdBlock2txFake: StorageTypes.IEntry = {
            content: JSON.stringify(blockWith2tx),
            id: '1',
            meta: { state: StorageTypes.ContentState.CONFIRMED, timestamp: 10 },
          };
          const result: any = {
            dataIdBlock2tx: dataIdBlock2txFake,
          };
          return result[param];
        },
      };

      dataAccess = new DataAccess(fakeStorage);
      await dataAccess.initialize();
    });

    it('can getChannelByTopic() with boundaries', async () => {
      expect(
        await dataAccess.getChannelsByTopic(arbitraryTopic1, { from: 9, to: 100 }),
      ).toMatchObject({
        meta: {
          storageMeta: {
            [arbitraryId1]: [
              {
                state: DataAccessTypes.TransactionState.CONFIRMED,
                timestamp: 10,
              },
            ],
          },
          transactionsStorageLocation: { [arbitraryId1]: [dataIdBlock2tx] },
        },
        result: {
          transactions: {
            [arbitraryId1]: [
              {
                state: DataAccessTypes.TransactionState.CONFIRMED,
                timestamp: 10,
                transaction: transactionMock1,
              },
            ],
          },
        },
      });
    });

    it('can getChannelByTopic() with boundaries too restrictive', async () => {
      expect(
        await dataAccess.getChannelsByTopic(arbitraryTopic1, { from: 11, to: 100 }),
      ).toMatchObject({
        meta: {
          storageMeta: {},
          transactionsStorageLocation: {},
        },
        result: { transactions: {} },
      });
    });
  });

  describe('getChannelsByMultipleTopics', () => {
    let dataAccess: any;

    beforeEach(async () => {
      const fakeStorage = {
        ...defaultFakeStorage,
        read: (param: string): any => {
          const dataIdBlock2txFake: StorageTypes.IEntry = {
            content: JSON.stringify(blockWith2tx),
            id: '1',
            meta: { state: StorageTypes.ContentState.CONFIRMED, timestamp: 10 },
          };
          const result: any = {
            dataIdBlock2tx: dataIdBlock2txFake,
          };
          return result[param];
        },
      };

      dataAccess = new DataAccess(fakeStorage);
      await dataAccess.initialize();
    });

    it('can getChannelsByMultipleTopics() with boundaries', async () => {
      const ret = await dataAccess.getChannelsByMultipleTopics([arbitraryTopic1, arbitraryTopic2], {
        from: 9,
        to: 100,
      });

      expect(ret.meta).toMatchObject({
        storageMeta: {
          [arbitraryId1]: [
            {
              state: DataAccessTypes.TransactionState.CONFIRMED,
              timestamp: 10,
            },
          ],
          [arbitraryId2]: [
            {
              state: DataAccessTypes.TransactionState.CONFIRMED,
              timestamp: 10,
            },
          ],
        },
        transactionsStorageLocation: {
          [arbitraryId1]: [dataIdBlock2tx],
          [arbitraryId2]: [dataIdBlock2tx],
        },
      });
      expect(ret.result).toMatchObject({
        transactions: {
          [arbitraryId1]: [
            {
              state: DataAccessTypes.TransactionState.CONFIRMED,
              timestamp: 10,
              transaction: transactionMock1,
            },
          ],
          [arbitraryId2]: [
            {
              state: DataAccessTypes.TransactionState.CONFIRMED,
              timestamp: 10,
              transaction: transactionMock2,
            },
          ],
        },
      });
    });

    it('can getChannelByTopic() with boundaries too restrictive', async () => {
      expect(
        await dataAccess.getChannelsByMultipleTopics([arbitraryTopic1, arbitraryTopic2], {
          from: 11,
          to: 100,
        }),
      ).toMatchObject({
        meta: {
          storageMeta: {},
          transactionsStorageLocation: {},
        },
        result: { transactions: {} },
      });
    });
  });

  describe('persistTransaction', () => {
    it('can persistTransaction()', async () => {
      const dataAccess = new DataAccess(defaultFakeStorage);
      await dataAccess.initialize();

      const errFunction = jest.fn();
      const result = await dataAccess.persistTransaction(transactionMock1, arbitraryId1, [
        arbitraryTopic1,
      ]);
      result.on('error', errFunction).on('confirmed', (resultConfirmed1) => {
        expect(resultConfirmed1).toMatchObject({
          meta: {
            storageMeta: {
              state: DataAccessTypes.TransactionState.CONFIRMED,
              timestamp: 1,
            },
            topics: [arbitraryTopic1],
            transactionStorageLocation: dataIdBlock2tx,
          },
          result: {},
        });
      });

      jest.advanceTimersByTime(11);

      expect(errFunction).not.toHaveBeenCalled();
      /* tslint:disable:object-literal-sort-keys  */
      /* tslint:disable:object-literal-key-quotes  */
      expect(defaultFakeStorage.append).toHaveBeenCalledWith(
        JSON.stringify({
          header: {
            channelIds: {
              [arbitraryId1]: [0],
            },
            topics: {
              [arbitraryId1]: [arbitraryTopic1],
            },
            version: '0.1.0',
          },
          transactions: [
            {
              data: '{"attribut1":"plop","attribut2":"value"}',
            },
          ],
        }),
      );
      expect(result.meta).toMatchObject({
        storageMeta: {
          state: DataAccessTypes.TransactionState.PENDING,
          timestamp: 1,
        },
        topics: [arbitraryTopic1],
        transactionStorageLocation: dataIdBlock2tx,
      });
    });

    it('cannot persistTransaction() if not initialized', async () => {
      const dataAccess = new DataAccess(defaultFakeStorage);

      await expect(
        dataAccess.persistTransaction(transactionMock1, arbitraryId1, [arbitraryTopic1]),
      ).rejects.toThrowError('DataAccess must be initialized');
    });

    it('cannot persistTransaction() if a topic is not well formatted', async () => {
      const dataAccess = new DataAccess(defaultFakeStorage);
      const notFormattedTopic = 'This topic is not formatted';
      await dataAccess.initialize();

      await expect(
        dataAccess.persistTransaction(transactionMock1, arbitraryId1, [
          notFormattedTopic,
          arbitraryTopic2,
        ]),
      ).rejects.toThrowError(
        `The following topics are not well formatted: ["This topic is not formatted"]`,
      );
    });

    it('cannot persistTransaction() and emit error if confirmation failed', async () => {
      const mockStorageEmittingError: StorageTypes.IStorage = {
        _getStatus: jest.fn(),
        _ipfsAdd: jest.fn(),
        append: jest.fn((): any => {
          const appendResultWithEvent = Object.assign(new EventEmitter(), appendResult);
          setTimeout(
            () => {
              appendResultWithEvent.emit('error', 'error for test purpose');
            },
            // tslint:disable-next-line:no-magic-numbers
            10,
          );
          return appendResultWithEvent;
        }),
        getData: (): Promise<StorageTypes.IEntriesWithLastTimestamp> => defaultTestData,
        getIgnoredData: async (): Promise<StorageTypes.IEntry[]> => [],
        initialize: jest.fn(),
        read: (param: string): any => {
          const dataIdBlock2txFake: any = {
            meta: {},
          };
          const resultRead: any = {
            dataIdBlock2tx: dataIdBlock2txFake,
          };
          return resultRead[param];
        },
        readMany(params: string[]): Promise<any[]> {
          return Promise.all(params.map(testContext.read));
        },
      };

      const dataAccess = new DataAccess(mockStorageEmittingError);
      await dataAccess.initialize();

      const result = await dataAccess.persistTransaction(transactionMock1, arbitraryId1, [
        arbitraryTopic1,
      ]);
      result.on('error', (error) => {
        // result Confirmed wrong
        expect(error).toEqual('error for test purpose');
      });
      jest.advanceTimersByTime(11);

      // result wrong
      expect(result.meta).toMatchObject({
        storageMeta: {
          state: DataAccessTypes.TransactionState.PENDING,
          timestamp: 1,
        },
        topics: [arbitraryTopic1],
        transactionStorageLocation: dataIdBlock2tx,
      });
    });
  });

  describe('_getStatus', () => {
    let dataAccess: any;

    beforeEach(async () => {
      const fakeStorage = {
        ...defaultFakeStorage,
        read: (param: string): any => {
          const dataIdBlock2txFake: StorageTypes.IEntry = {
            content: JSON.stringify(blockWith2tx),
            id: '1',
            meta: { state: StorageTypes.ContentState.CONFIRMED, timestamp: 10 },
          };
          const result: any = {
            dataIdBlock2tx: dataIdBlock2txFake,
          };
          return result[param];
        },
      };

      dataAccess = new DataAccess(fakeStorage);
      await dataAccess.initialize();
    });

    it('can _getStatus()', async () => {
      expect(await dataAccess._getStatus()).toMatchObject({
        filesIgnored: { count: 0, list: undefined },
        filesRetrieved: { count: 1, lastTimestamp: 10, list: undefined },
        lastSynchronizationTimestamp: 0,
        storage: { fake: 'status' },
        synchronizationConfig: {
          intervalTime: 10000,
          successiveFailureThreshold: 5,
        },
      });
    });
    it('can _getStatus() with details', async () => {
      expect(await dataAccess._getStatus(true)).toMatchObject({
        filesIgnored: { count: 0, list: {} },
        filesRetrieved: { count: 1, lastTimestamp: 10, list: ['dataIdBlock2tx'] },
        lastSynchronizationTimestamp: 0,
        storage: { fake: 'status' },
        synchronizationConfig: {
          intervalTime: 10000,
          successiveFailureThreshold: 5,
        },
      });
    });
  });

  it('synchronizeNewDataId() should throw an error if not initialized', async () => {
    const dataAccess = new DataAccess(defaultFakeStorage);

    await expect(dataAccess.synchronizeNewDataIds()).rejects.toThrowError(
      'DataAccess must be initialized',
    );
  });

  it('synchronizeNewDataId() should ignore data not following the block standard', async () => {
    const blockWithoutHeader = {
      transactions: [{ data: '' }],
    };

    const testDataNotJsonData: Promise<StorageTypes.IEntriesWithLastTimestamp> = Promise.resolve({
      entries: [
        {
          content: JSON.stringify(blockWithoutHeader),
          id: 'whatever',
          meta: { state: StorageTypes.ContentState.CONFIRMED, timestamp: 10 },
        },
      ],
      lastTimestamp: 0,
    });

    const fakeStorageWithNotJsonData: StorageTypes.IStorage = {
      _ipfsAdd: jest.fn(),
      append: jest.fn(),
      getData: (): Promise<StorageTypes.IEntriesWithLastTimestamp> => testDataNotJsonData,
      getIgnoredData: async (): Promise<StorageTypes.IEntry[]> => [],
      _getStatus: jest.fn(),
      initialize: jest.fn(),
      read: jest.fn(),
      readMany: jest.fn(),
    };

    const dataAccess = new DataAccess(fakeStorageWithNotJsonData);
    await dataAccess.initialize();
    const spy = jest.fn();
    dataAccess.transactionIndex.addTransaction = spy;
    await dataAccess.synchronizeNewDataIds();

    expect(spy).not.toHaveBeenCalled();
  });

  it('allows to get new transactions after synchronizeNewDataId() call', async () => {
    // We create a fakeStorage where getData() called at initialization returns empty structure
    const fakeStorage = {
      ...defaultFakeStorage,
      getData: async (options: any): Promise<StorageTypes.IEntriesWithLastTimestamp> => {
        if (!options) {
          return Promise.resolve(emptyDataResult);
        }
        return getDataResult;
      },
      getIgnoredData: async (): Promise<StorageTypes.IEntry[]> => getIgnoredDataResult,
      read: (param: string): any => {
        const dataIdBlock2txFake: StorageTypes.IEntry = {
          content: JSON.stringify(blockWith2tx),
          id: '1',
          meta: { state: StorageTypes.ContentState.CONFIRMED, timestamp: 1 },
        };
        const result: any = {
          dataIdBlock2tx: dataIdBlock2txFake,
          dataIdBlock1txBis: getIgnoredDataResult[0],
        };
        return result[param];
      },
    };

    const dataAccess = new DataAccess(fakeStorage);
    await dataAccess.initialize();

    expect(await dataAccess.getChannelsByTopic(arbitraryTopic1)).toMatchObject({
      meta: {
        storageMeta: {},
        transactionsStorageLocation: {},
      },
      result: { transactions: {} },
    });

    // Transactions should be available after synchronization
    await dataAccess.synchronizeNewDataIds();

    // result with arbitraryTopic1 wrong
    await expect(dataAccess.getChannelsByTopic(arbitraryTopic1)).resolves.toMatchObject({
      meta: {
        storageMeta: {
          [arbitraryId1]: [
            { state: StorageTypes.ContentState.CONFIRMED, timestamp: 1 },
            { state: StorageTypes.ContentState.CONFIRMED, timestamp: 1 },
          ],
        },
        transactionsStorageLocation: { [arbitraryId1]: [dataIdBlock2tx, dataIdBlock1txBis] },
      },
      result: {
        transactions: {
          [arbitraryId1]: [
            {
              state: DataAccessTypes.TransactionState.CONFIRMED,
              transaction: transactionMock1,
              timestamp: 1,
            },
            {
              state: DataAccessTypes.TransactionState.CONFIRMED,
              transaction: transactionMock3,
              timestamp: 1,
            },
          ],
        },
      },
    });
    // result with arbitraryTopic2 wrong
    await expect(dataAccess.getChannelsByTopic(arbitraryTopic2)).resolves.toMatchObject({
      meta: {
        storageMeta: {
          [arbitraryId1]: [
            { state: DataAccessTypes.TransactionState.CONFIRMED, timestamp: 1 },
            { state: DataAccessTypes.TransactionState.CONFIRMED, timestamp: 1 },
          ],
          [arbitraryId2]: [{ state: DataAccessTypes.TransactionState.CONFIRMED, timestamp: 1 }],
        },
        transactionsStorageLocation: {
          [arbitraryId1]: [dataIdBlock2tx, dataIdBlock1txBis],
          [arbitraryId2]: [dataIdBlock2tx],
        },
      },
      result: {
        transactions: {
          [arbitraryId1]: [
            {
              state: DataAccessTypes.TransactionState.CONFIRMED,
              transaction: transactionMock1,
              timestamp: 1,
            },
            {
              state: DataAccessTypes.TransactionState.CONFIRMED,
              transaction: transactionMock3,
              timestamp: 1,
            },
          ],
          [arbitraryId2]: [
            {
              state: DataAccessTypes.TransactionState.CONFIRMED,
              transaction: transactionMock2,
              timestamp: 1,
            },
          ],
        },
      },
    });
  });

  it('startSynchronizationTimer() should throw an error if not initialized', async () => {
    const fakeStorageSpied: StorageTypes.IStorage = {
      _ipfsAdd: jest.fn(),
      append: jest.fn().mockReturnValue(appendResult),
      getData: jest.fn(() => Promise.resolve({} as any)),
      getIgnoredData: async (): Promise<StorageTypes.IEntry[]> => [],
      _getStatus: jest.fn(),
      initialize: jest.fn(),
      read: jest.fn(),
      readMany: jest.fn(),
    };
    const dataAccess = new DataAccess(fakeStorageSpied);

    expect(() => dataAccess.startAutoSynchronization()).toThrowError(
      'DataAccess must be initialized',
    );
  });

  it('allows to get new transactions automatically if startSynchronizationTimer() is called', async () => {
    const fakeStorage = {
      ...defaultFakeStorage,
      read: (param: string): any => {
        const dataIdBlock2txFake: StorageTypes.IEntry = {
          content: JSON.stringify(blockWith2tx),
          id: '1',
          meta: { state: StorageTypes.ContentState.CONFIRMED, timestamp: 1 },
        };
        const result: any = {
          dataIdBlock2tx: dataIdBlock2txFake,
        };
        return result[param];
      },
    };

    const dataAccess = new DataAccess(fakeStorage, {
      synchronizationIntervalTime: 1000,
    });
    dataAccess.synchronizeNewDataIds = jest.fn();
    await dataAccess.initialize();

    expect(dataAccess.synchronizeNewDataIds).not.toHaveBeenCalled();

    dataAccess.startAutoSynchronization();
    jest.advanceTimersByTime(1100);
    await flushCallStack();

    // Should have been called once after 1100ms
    expect(dataAccess.synchronizeNewDataIds).toHaveBeenCalledTimes(1);

    jest.advanceTimersByTime(1000);
    await flushCallStack();

    // Should have been called once after 2100ms
    expect(dataAccess.synchronizeNewDataIds).toHaveBeenCalledTimes(2);

    dataAccess.stopAutoSynchronization();
    jest.advanceTimersByTime(1000);
    await flushCallStack();

    // Not called anymore after stopAutoSynchronization()
    expect(dataAccess.synchronizeNewDataIds).toHaveBeenCalledTimes(2);
  });

  it(`should not get twice the same data during synchronization`, async () => {
    let lastTimestampReturnedByGetData: number = 0;

    const fakeStorageSpied: StorageTypes.IStorage = {
      ...defaultFakeStorage,
      getData: jest.fn(
        (): Promise<StorageTypes.IEntriesWithLastTimestamp> =>
          Promise.resolve({
            entries: [],
            lastTimestamp: lastTimestampReturnedByGetData,
          }),
      ),
    };

    lastTimestampReturnedByGetData = 500;
    const dataAccess = new DataAccess(fakeStorageSpied, {
      synchronizationIntervalTime: 1000,
    });
    await dataAccess.initialize();

    // At initialization, getData is called with no time boundaries
    expect(fakeStorageSpied.getData).toHaveBeenNthCalledWith(1, undefined);

    dataAccess.startAutoSynchronization();

    // Mock Date.now to parse the value "to" of the time boundaries
    Date.now = (): number => 1000000;
    lastTimestampReturnedByGetData = 800;
    jest.advanceTimersByTime(1100);
    await flushCallStack();

    expect(fakeStorageSpied.getData).toHaveBeenNthCalledWith(2, { from: 501, to: 1000 });

    dataAccess.stopAutoSynchronization();
  });
});
