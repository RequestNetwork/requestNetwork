import 'mocha';
import * as sinon from 'sinon';

const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const spies = require('chai-spies');

chai.use(chaiAsPromised);
const expect = chai.expect;
chai.use(spies);

import { DataAccessTypes, StorageTypes } from '@requestnetwork/types';

import RequestDataAccessBlock from '../src/block';
import DataAccess from '../src/data-access';

// We use this function to flush the call stack
// If we don't use this function, the fake timer will be increased before the interval function being called
const flushCallStack = (): Promise<any> => {
  return new Promise(
    (resolve): any => {
      setTimeout(resolve, 0);
      clock.tick(1);
    },
  );
};

const transactionDataMock1String = JSON.stringify({
  attribut1: 'plop',
  attribut2: 'value',
});
const transactionDataMock2String = JSON.stringify({
  attribut1: 'foo',
  attribut2: 'bar',
});

const transactionMock1: DataAccessTypes.ITransaction = {
  data: transactionDataMock1String,
};
const transactionMock2: DataAccessTypes.ITransaction = {
  data: transactionDataMock2String,
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

const dataIdBlock2tx = 'dataIdBlock2tx';

const getDataIdResult: StorageTypes.IResultDataIdsWithMeta = {
  meta: [{ timestamp: 10 }],
  result: {
    dataIds: [dataIdBlock2tx],
  },
};

const getDataResult: StorageTypes.IResultEntriesWithMeta = {
  meta: [{ timestamp: 10 }],
  result: {
    contents: [JSON.stringify(blockWith2tx)],
    dataIds: [dataIdBlock2tx],
    lastTimestamp: 0,
  },
};

const appendResult: StorageTypes.IResultDataIdWithMeta = {
  meta: {
    timestamp: 1,
  },
  result: {
    dataId: dataIdBlock2tx,
  },
};

const emptyDataIdResult: StorageTypes.IResultDataIdsWithMeta = {
  meta: [],
  result: {
    dataIds: [],
  },
};

const emptyDataResult: StorageTypes.IResultEntriesWithMeta = {
  meta: [],
  result: {
    contents: [],
    dataIds: [],
    lastTimestamp: 0,
  },
};

const defaultTestData: Promise<StorageTypes.IResultEntriesWithMeta> = Promise.resolve(
  getDataResult,
);
const defaultTestTopics: Promise<StorageTypes.IResultDataIdsWithMeta> = Promise.resolve(
  getDataIdResult,
);
const defaultFakeStorage: StorageTypes.IStorage = {
  append: chai.spy.returns(appendResult),
  getData: (): Promise<StorageTypes.IResultEntriesWithMeta> => defaultTestData,
  getDataId: (): any => defaultTestTopics,
  initialize: chai.spy(),
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

let clock: sinon.SinonFakeTimers;

// tslint:disable:no-magic-numbers
/* tslint:disable:no-unused-expression */
describe('data-access', () => {
  beforeEach(async () => {
    clock = sinon.useFakeTimers();
  });

  describe('constructor', () => {
    it('cannot initialize with getData without result', async () => {
      const customFakeStorage = {
        ...defaultFakeStorage,
        getData: (): Promise<StorageTypes.IResultEntriesWithMeta> =>
          ({ meta: [], result: { lastTimestamp: 0 } } as any),
      };

      const dataAccess = new DataAccess(customFakeStorage);

      await expect(dataAccess.initialize()).to.be.rejectedWith(
        'data from storage do not follow the standard',
      );
    });

    it('cannot initialize twice', async () => {
      const dataAccess = new DataAccess(defaultFakeStorage);
      await dataAccess.initialize();

      await expect(dataAccess.initialize()).to.be.rejectedWith('already initialized');
    });

    it('cannot getChannelsByTopic if not initialized', async () => {
      const fakeStorage = {
        ...defaultFakeStorage,
        read: (param: string): any => {
          const dataIdBlock2txFake: StorageTypes.IResultContentWithMeta = {
            meta: { timestamp: 1 },
            result: { content: JSON.stringify(blockWith2tx) },
          };
          const result: any = {
            dataIdBlock2tx: dataIdBlock2txFake,
          };
          return result[param];
        },
      };

      const dataAccess = new DataAccess(fakeStorage);

      await expect(dataAccess.getChannelsByTopic(arbitraryTopic1)).to.be.rejectedWith(
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
          const dataIdBlock2txFake: StorageTypes.IResultContentWithMeta = {
            meta: { timestamp: 10 },
            result: { content: JSON.stringify(blockWith2tx) },
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
        'result with arbitraryId1 wrong',
      ).to.deep.equal({
        meta: {
          storageMeta: [{ timestamp: 10 }],
          transactionsStorageLocation: [dataIdBlock2tx],
        },
        result: { transactions: [{ transaction: transactionMock1, timestamp: 10 }] },
      });
    });

    it('can getTransactionsByChannelId() with boundaries too restrictive', async () => {
      expect(
        await dataAccess.getTransactionsByChannelId(arbitraryId1, { from: 11, to: 100 }),
        'result with arbitraryId1 wrong',
      ).to.deep.equal({
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
          const dataIdBlock2txFake: StorageTypes.IResultContentWithMeta = {
            meta: { timestamp: 10 },
            result: { content: JSON.stringify(blockWith2tx) },
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
        'result with arbitraryTopic1 wrong',
      ).to.deep.equal({
        meta: {
          storageMeta: { [arbitraryId1]: [{ timestamp: 10 }] },
          transactionsStorageLocation: { [arbitraryId1]: [dataIdBlock2tx] },
        },
        result: {
          transactions: { [arbitraryId1]: [{ transaction: transactionMock1, timestamp: 10 }] },
        },
      });
    });

    it('can getChannelByTopic() with boundaries too restrictive', async () => {
      expect(
        await dataAccess.getChannelsByTopic(arbitraryTopic1, { from: 11, to: 100 }),
        'result with arbitraryTopic1 wrong',
      ).to.deep.equal({
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
          const dataIdBlock2txFake: StorageTypes.IResultContentWithMeta = {
            meta: { timestamp: 10 },
            result: { content: JSON.stringify(blockWith2tx) },
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

      expect(ret.meta, 'meta wrong').to.deep.equal({
        storageMeta: { [arbitraryId1]: [{ timestamp: 10 }], [arbitraryId2]: [{ timestamp: 10 }] },
        transactionsStorageLocation: {
          [arbitraryId1]: [dataIdBlock2tx],
          [arbitraryId2]: [dataIdBlock2tx],
        },
      });
      expect(ret.result, 'result meta wrong').to.deep.equal({
        transactions: {
          [arbitraryId1]: [{ transaction: transactionMock1, timestamp: 10 }],
          [arbitraryId2]: [{ transaction: transactionMock2, timestamp: 10 }],
        },
      });
    });

    it('can getChannelByTopic() with boundaries too restrictive', async () => {
      expect(
        await dataAccess.getChannelsByMultipleTopics([arbitraryTopic1, arbitraryTopic2], {
          from: 11,
          to: 100,
        }),
        'result with arbitraryTopic1 wrong',
      ).to.deep.equal({
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

      const result = await dataAccess.persistTransaction(transactionMock1, arbitraryId1, [
        arbitraryTopic1,
      ]);

      /* tslint:disable:object-literal-sort-keys  */
      /* tslint:disable:object-literal-key-quotes  */
      expect(defaultFakeStorage.append).to.have.been.called.with(
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
      expect(result, 'result wrong').to.deep.equal({
        meta: {
          storageMeta: { timestamp: 1 },
          topics: [arbitraryTopic1],
          transactionStorageLocation: dataIdBlock2tx,
        },
        result: {},
      });
    });

    it('cannot persistTransaction() if not initialized', async () => {
      const dataAccess = new DataAccess(defaultFakeStorage);

      await expect(
        dataAccess.persistTransaction(transactionMock1, arbitraryId1, [arbitraryTopic1]),
      ).to.be.rejectedWith('DataAccess must be initialized');
    });

    it('cannot persistTransaction() if a topic is not well formatted', async () => {
      const dataAccess = new DataAccess(defaultFakeStorage);
      const notFormattedTopic = 'This topic is not formatted';
      await dataAccess.initialize();

      await expect(
        dataAccess.persistTransaction(transactionMock1, arbitraryId1, [notFormattedTopic, arbitraryTopic2]),
      ).to.be.rejectedWith(`The following topics are not well formatted: ["This topic is not formatted"]`);
    });
  });

  it('synchronizeNewDataId() should throw an error if not initialized', async () => {
    const dataAccess = new DataAccess(defaultFakeStorage);

    await expect(dataAccess.synchronizeNewDataIds()).to.be.rejectedWith(
      'DataAccess must be initialized',
    );
  });

  it('synchronizeNewDataId() should ignore data not following the block standard', async () => {
    const blockWithoutHeader = {
      transactions: [{ data: '' }],
    };

    const testDataNotJsonData: Promise<StorageTypes.IResultEntriesWithMeta> = Promise.resolve({
      meta: [{ timestamp: 10 }],
      result: {
        contents: [
          // no Header
          JSON.stringify(blockWithoutHeader),
        ],
        dataIds: ['whatever'],
        lastTimestamp: 0,
      },
    });

    const fakeStorageWithNotJsonData: StorageTypes.IStorage = {
      append: chai.spy(),
      getData: (): Promise<StorageTypes.IResultEntriesWithMeta> => testDataNotJsonData,
      getDataId: chai.spy(),
      initialize: chai.spy(),
      read: chai.spy(),
      readMany: chai.spy(),
    };

    const dataAccess = new DataAccess(fakeStorageWithNotJsonData);
    await dataAccess.initialize();

    dataAccess.transactionIndex.addTransaction = chai.spy();
    await dataAccess.synchronizeNewDataIds();

    expect(dataAccess.transactionIndex.addTransaction).to.have.been.called.exactly(0);
  });

  it('allows to get new transactions after synchronizeNewDataId() call', async () => {
    const testTopics: Promise<StorageTypes.IResultDataIdsWithMeta> = Promise.resolve(
      getDataIdResult,
    );
    const testData: Promise<StorageTypes.IResultEntriesWithMeta> = Promise.resolve(getDataResult);

    // We create a fakeStorage where getDataId() called at initialization returns empty structure
    // and getNewDataId() returns testTopics
    const fakeStorage = {
      ...defaultFakeStorage,
      getData: (options: any): Promise<StorageTypes.IResultEntriesWithMeta> => {
        if (!options) {
          return Promise.resolve(emptyDataResult);
        }
        return testData;
      },
      getDataId: (options: any): any => {
        if (!options) {
          return emptyDataIdResult;
        }
        return testTopics;
      },
      read: (param: string): any => {
        const dataIdBlock2txFake: StorageTypes.IResultContentWithMeta = {
          meta: { timestamp: 1 },
          result: { content: JSON.stringify(blockWith2tx) },
        };
        const result: any = {
          dataIdBlock2tx: dataIdBlock2txFake,
        };
        return result[param];
      },
    };

    const dataAccess = new DataAccess(fakeStorage);
    await dataAccess.initialize();

    expect(
      await dataAccess.getChannelsByTopic(arbitraryTopic1),
      'result with arbitraryTopic1 not empty',
    ).to.deep.equal({
      meta: {
        storageMeta: {},
        transactionsStorageLocation: {},
      },
      result: { transactions: {} },
    });

    // Transactions should be available avec synchronization
    await expect(dataAccess.synchronizeNewDataIds()).to.be.fulfilled;

    expect(
      await dataAccess.getChannelsByTopic(arbitraryTopic1),
      'result with arbitraryTopic1 wrong',
    ).to.deep.equal({
      meta: {
        storageMeta: { [arbitraryId1]: [{ timestamp: 1 }] },
        transactionsStorageLocation: { [arbitraryId1]: [dataIdBlock2tx] },
      },
      result: {
        transactions: { [arbitraryId1]: [{ transaction: transactionMock1, timestamp: 1 }] },
      },
    });

    expect(
      await dataAccess.getChannelsByTopic(arbitraryTopic2),
      'result with arbitraryTopic2 wrong',
    ).to.deep.equal({
      meta: {
        storageMeta: {
          [arbitraryId1]: [{ timestamp: 1 }],
          [arbitraryId2]: [{ timestamp: 1 }],
        },
        transactionsStorageLocation: {
          [arbitraryId1]: [dataIdBlock2tx],
          [arbitraryId2]: [dataIdBlock2tx],
        },
      },
      result: {
        transactions: {
          [arbitraryId1]: [{ transaction: transactionMock1, timestamp: 1 }],
          [arbitraryId2]: [{ transaction: transactionMock2, timestamp: 1 }],
        },
      },
    });
  });

  it('startSynchronizationTimer() should throw an error if not initialized', async () => {
    const fakeStorageSpied: StorageTypes.IStorage = {
      append: chai.spy.returns(appendResult),
      getData: (): Promise<StorageTypes.IResultEntriesWithMeta> => chai.spy(),
      getDataId: chai.spy.returns({ result: { dataIds: [] } }),
      initialize: chai.spy(),
      read: chai.spy(),
      readMany: chai.spy(),
    };
    const dataAccess = new DataAccess(fakeStorageSpied);

    expect(() => dataAccess.startAutoSynchronization()).to.throw('DataAccess must be initialized');
  });

  it('allows to get new transactions automatically if startSynchronizationTimer() is called', async () => {
    const fakeStorage = {
      ...defaultFakeStorage,
      getDataId: (): any => emptyDataIdResult,
      read: (param: string): any => {
        const dataIdBlock2txFake: StorageTypes.IResultContentWithMeta = {
          meta: { timestamp: 1 },
          result: { content: JSON.stringify(blockWith2tx) },
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
    dataAccess.synchronizeNewDataIds = chai.spy();
    await dataAccess.initialize();

    expect(dataAccess.synchronizeNewDataIds).to.have.been.called.exactly(0);

    dataAccess.startAutoSynchronization();
    clock.tick(1100);
    await flushCallStack();

    // Should have been called once after 1100ms
    expect(dataAccess.synchronizeNewDataIds).to.have.been.called.exactly(1);

    clock.tick(1000);
    await flushCallStack();

    // Should have been called once after 2100ms
    expect(dataAccess.synchronizeNewDataIds).to.have.been.called.exactly(2);

    dataAccess.stopAutoSynchronization();
    clock.tick(1000);
    await flushCallStack();

    // Not called anymore after stopAutoSynchronization()
    expect(dataAccess.synchronizeNewDataIds).to.have.been.called.exactly(2);
  });

  it(`should not get twice the same data during synchronization`, async () => {
    let args;
    let lastTimestampReturnedByGetData: number = 0;

    const fakeStorageSpied: StorageTypes.IStorage = {
      ...defaultFakeStorage,
      getData: sinon.spy(
        (): Promise<StorageTypes.IResultEntriesWithMeta> =>
          Promise.resolve({
            meta: [],
            result: { contents: [], dataIds: [], lastTimestamp: lastTimestampReturnedByGetData },
          }),
      ),
    };

    lastTimestampReturnedByGetData = 500;
    const dataAccess = new DataAccess(fakeStorageSpied, {
      synchronizationIntervalTime: 1000,
    });
    await dataAccess.initialize();

    // At initialization, getData is called with no time boundaries
    args = (fakeStorageSpied.getData as any).getCall(0).args[0];
    expect(args).to.be.undefined;

    dataAccess.startAutoSynchronization();

    // Mock Date.now to parse the value "to" of the time boundaries
    Date.now = (): number => 1000000;
    lastTimestampReturnedByGetData = 800;
    clock.tick(1100);
    await flushCallStack();

    args = (fakeStorageSpied.getData as any).getCall(1).args[0];
    expect(args).to.deep.equal({ from: 501, to: 1000 });

    dataAccess.stopAutoSynchronization();
  });
});
