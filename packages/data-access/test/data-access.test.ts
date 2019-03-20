import 'mocha';
import * as sinon from 'sinon';

const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const spies = require('chai-spies');

chai.use(chaiAsPromised);
const expect = chai.expect;
chai.use(spies);

import { DataAccess as DataAccessTypes, Storage as StorageTypes } from '@requestnetwork/types';

import RequestDataAccessBlock from '../src/block';
import DataAccess from '../src/data-access';

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

const arbitraryId1 = '0x111111111111111';
const arbitraryId2 = '0x222222222222222';

const arbitraryTopic1 = '0xaaaaaa';
const arbitraryTopic2 = '0xccccccccccc';

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

const getDataIdResult: StorageTypes.IGetDataIdReturn = {
  meta: {
    metaDataIds: [],
  },
  result: {
    dataIds: [dataIdBlock2tx],
  },
};

const appendResult: StorageTypes.IOneDataIdAndMeta = {
  meta: {
    timestamp: 1,
  },
  result: {
    dataId: dataIdBlock2tx,
  },
};

const emptyDataIdResult: StorageTypes.IGetNewDataIdReturn = {
  meta: {
    metaDataIds: [],
  },
  result: {
    dataIds: [],
  },
};

let clock: sinon.SinonFakeTimers;

// tslint:disable:no-magic-numbers
/* tslint:disable:no-unused-expression */
describe('data-access', () => {
  beforeEach(async () => {
    clock = sinon.useFakeTimers();
  });

  afterEach(async () => {
    sinon.restore();
  });

  describe('constructor and getTransactionsByTopic', () => {
    it('cannot initialize with data from read without result', async () => {
      const testTopics: Promise<StorageTypes.IGetDataIdReturn> = Promise.resolve(getDataIdResult);

      const fakeStorage: StorageTypes.IStorage = {
        append: chai.spy(),
        getData: (): any => chai.spy(),
        getDataId: (): any => testTopics,
        read: (param: string): any => {
          const dataIdBlock2txFake: any = {
            meta: {},
          };
          const result: any = {
            dataIdBlock2tx: dataIdBlock2txFake,
          };
          return result[param];
        },
      };

      const dataAccess = new DataAccess(fakeStorage);

      await expect(dataAccess.initialize()).to.be.rejectedWith(
        'data from storage do not follow the standard, result is missing',
      );
    });

    it('cannot initialize with data from getDataId without result', async () => {
      const testTopics: Promise<any> = Promise.resolve({
        meta: {
          metaDataIds: [],
        },
      });

      const fakeStorage: StorageTypes.IStorage = {
        append: chai.spy(),
        getData: (): any => chai.spy(),
        getDataId: (): any => testTopics,
        read: (param: string): any => {
          const dataIdBlock2txFake: any = {
            meta: {},
          };
          const result: any = {
            dataIdBlock2tx: dataIdBlock2txFake,
          };
          return result[param];
        },
      };

      const dataAccess = new DataAccess(fakeStorage);

      await expect(dataAccess.initialize()).to.be.rejectedWith(
        'data from storage do not follow the standard, result is missing',
      );
    });

    it('cannot initialize with content from read not following the standard', async () => {
      const testTopics: Promise<StorageTypes.IGetDataIdReturn> = Promise.resolve(getDataIdResult);

      const fakeStorage: StorageTypes.IStorage = {
        append: chai.spy(),
        getData: (): any => chai.spy(),
        getDataId: (): any => testTopics,
        read: (param: string): any => {
          const dataIdBlock2txFake: any = {
            meta: {},
            result: { content: JSON.stringify({ notFolling: 'the standad' }) },
          };
          const result: any = {
            dataIdBlock2tx: dataIdBlock2txFake,
          };
          return result[param];
        },
      };

      const dataAccess = new DataAccess(fakeStorage);

      await expect(dataAccess.initialize()).to.be.rejectedWith(
        'data from storage do not follow the standard, storage location: "dataIdBlock2tx"',
      );
    });

    it('cannot initialize with content from read not being JSON parsable', async () => {
      const testTopics: Promise<StorageTypes.IGetDataIdReturn> = Promise.resolve(getDataIdResult);

      const fakeStorage: StorageTypes.IStorage = {
        append: chai.spy(),
        getData: (): any => chai.spy(),
        getDataId: (): any => testTopics,
        read: (param: string): any => {
          const dataIdBlock2txFake: any = {
            meta: {},
            result: { content: 'This is not JSON parsable' },
          };
          const result: any = {
            dataIdBlock2tx: dataIdBlock2txFake,
          };
          return result[param];
        },
      };

      const dataAccess = new DataAccess(fakeStorage);

      await expect(dataAccess.initialize()).to.be.rejectedWith(`can't parse content of the dataId`);
    });

    it('can construct and getTransactionsByTopic', async () => {
      const testTopics: Promise<StorageTypes.IGetDataIdReturn> = Promise.resolve(getDataIdResult);

      const fakeStorage: StorageTypes.IStorage = {
        append: chai.spy(),
        getData: (): any => chai.spy(),
        getDataId: (): any => testTopics,
        read: (param: string): any => {
          const dataIdBlock2txFake: StorageTypes.IOneContentAndMeta = {
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
        await dataAccess.getTransactionsByTopic(arbitraryTopic1),
        'result with arbitraryTopic1 wrong',
      ).to.deep.equal({
        meta: {
          storageMeta: [{ timestamp: 1 }],
          transactionsStorageLocation: ['dataIdBlock2tx'],
        },
        result: { transactions: [{ transaction: transactionMock1, timestamp: 1 }] },
      });

      expect(
        await dataAccess.getTransactionsByTopic(arbitraryTopic2),
        'result with arbitraryTopic2 wrong',
      ).to.deep.equal({
        meta: {
          storageMeta: [{ timestamp: 1 }, { timestamp: 1 }],
          transactionsStorageLocation: ['dataIdBlock2tx', 'dataIdBlock2tx'],
        },
        result: {
          transactions: [
            { transaction: transactionMock1, timestamp: 1 },
            { transaction: transactionMock2, timestamp: 1 },
          ],
        },
      });
    });

    it('cannot initialize twice', async () => {
      const testTopics: Promise<StorageTypes.IGetDataIdReturn> = Promise.resolve(getDataIdResult);

      const fakeStorage: StorageTypes.IStorage = {
        append: chai.spy(),
        getData: (): any => chai.spy(),
        getDataId: (): any => testTopics,
        read: (param: string): any => {
          const dataIdBlock2txFake: StorageTypes.IOneContentAndMeta = {
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

      await expect(dataAccess.initialize()).to.be.rejectedWith('already initialized');
    });

    it('cannot getTransactionsByTopic if not initialized', async () => {
      const testTopics: Promise<StorageTypes.IGetDataIdReturn> = Promise.resolve(getDataIdResult);

      const fakeStorage: StorageTypes.IStorage = {
        append: chai.spy(),
        getData: (): any => chai.spy(),
        getDataId: (): any => testTopics,
        read: (param: string): any => {
          const dataIdBlock2txFake: StorageTypes.IOneContentAndMeta = {
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

      await expect(dataAccess.getTransactionsByTopic(arbitraryTopic1)).to.be.rejectedWith(
        'DataAccess must be initialized',
      );
    });
  });

  describe('getTransactionsByChannelId', () => {
    let dataAccess: any;

    beforeEach(async () => {
      const testTopics: Promise<StorageTypes.IGetDataIdReturn> = Promise.resolve(getDataIdResult);

      const fakeStorage: StorageTypes.IStorage = {
        append: chai.spy(),
        getData: (): any => chai.spy(),
        getDataId: (): any => testTopics,
        read: (param: string): any => {
          const dataIdBlock2txFake: StorageTypes.IOneContentAndMeta = {
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
          transactionsStorageLocation: ['dataIdBlock2tx'],
        },
        result: { transactions: [{ transaction: transactionMock1, timestamp: 10 }] },
      });
    });

    it('can getTransactionsByTopic() with boundaries too restrictive', async () => {
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

  describe('getTransactionsByTopic', () => {
    let dataAccess: any;

    beforeEach(async () => {
      const testTopics: Promise<StorageTypes.IGetDataIdReturn> = Promise.resolve(getDataIdResult);

      const fakeStorage: StorageTypes.IStorage = {
        append: chai.spy(),
        getData: (): any => chai.spy(),
        getDataId: (): any => testTopics,
        read: (param: string): any => {
          const dataIdBlock2txFake: StorageTypes.IOneContentAndMeta = {
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

    it('can getTransactionsByTopic() with boundaries', async () => {
      expect(
        await dataAccess.getTransactionsByTopic(arbitraryTopic1, { from: 9, to: 100 }),
        'result with arbitraryTopic1 wrong',
      ).to.deep.equal({
        meta: {
          storageMeta: [{ timestamp: 10 }],
          transactionsStorageLocation: ['dataIdBlock2tx'],
        },
        result: { transactions: [{ transaction: transactionMock1, timestamp: 10 }] },
      });
    });

    it('can getTransactionsByTopic() with boundaries too restrictive', async () => {
      expect(
        await dataAccess.getTransactionsByTopic(arbitraryTopic1, { from: 11, to: 100 }),
        'result with arbitraryTopic1 wrong',
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
      const testTopics: Promise<StorageTypes.IGetDataIdReturn> = Promise.resolve(getDataIdResult);

      const fakeStorage: StorageTypes.IStorage = {
        append: chai.spy(),
        getData: (): any => chai.spy(),
        getDataId: (): any => testTopics,
        read: (param: string): any => {
          const dataIdBlock2txFake: StorageTypes.IOneContentAndMeta = {
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
          transactionsStorageLocation: { [arbitraryId1]: ['dataIdBlock2tx'] },
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

  describe('persistTransaction', () => {
    it('can persistTransaction()', async () => {
      const fakeStorageSpied: StorageTypes.IStorage = {
        append: chai.spy.returns(appendResult),
        getData: (): any => chai.spy(),
        getDataId: chai.spy.returns({ result: { dataIds: [] } }),
        read: chai.spy(),
      };
      const dataAccess = new DataAccess(fakeStorageSpied);
      await dataAccess.initialize();

      const result = await dataAccess.persistTransaction(transactionMock1, arbitraryId1, [
        arbitraryTopic1,
      ]);

      /* tslint:disable:object-literal-sort-keys  */
      /* tslint:disable:object-literal-key-quotes  */
      expect(fakeStorageSpied.append).to.have.been.called.with(
        JSON.stringify({
          header: {
            channelIds: {
              [arbitraryId1]: [0],
            },
            topics: {
              [arbitraryId1]: [
                '0xaaaaaa',
                '0xc23dc7c66c4b91a3a53f9a052ab8c359fd133c8ddf976aab57f296ffd9d4a2ca',
              ],
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
          topics: [
            arbitraryTopic1,
            '0xc23dc7c66c4b91a3a53f9a052ab8c359fd133c8ddf976aab57f296ffd9d4a2ca',
          ],
          transactionStorageLocation: dataIdBlock2tx,
        },
        result: {},
      });
    });

    it('cannot persistTransaction() if not initialized', async () => {
      const fakeStorageSpied: StorageTypes.IStorage = {
        append: chai.spy.returns('fakeDataId'),
        getData: (): any => chai.spy(),
        getDataId: chai.spy.returns([]),
        read: chai.spy(),
      };
      const dataAccess = new DataAccess(fakeStorageSpied);

      await expect(
        dataAccess.persistTransaction(transactionMock1, arbitraryId1, [arbitraryTopic1]),
      ).to.be.rejectedWith('DataAccess must be initialized');
    });
  });

  it('synchronizeNewDataId() should throw an error if not initialized', async () => {
    const fakeStorageSpied: StorageTypes.IStorage = {
      append: chai.spy.returns(appendResult),
      getData: (): any => chai.spy(),
      getDataId: chai.spy.returns({ result: { dataIds: [] } }),
      read: chai.spy(),
    };
    const dataAccess = new DataAccess(fakeStorageSpied);

    await expect(dataAccess.synchronizeNewDataIds()).to.be.rejectedWith(
      'DataAccess must be initialized',
    );
  });

  it('allows to get new transactions after synchronizeNewDataId() call', async () => {
    const testTopics: Promise<StorageTypes.IGetDataIdReturn> = Promise.resolve(getDataIdResult);

    // We create a fakeStorage where getDataId() called at initialization returns empty structure
    // and getNewDataId() returns testTopics
    const fakeStorage: StorageTypes.IStorage = {
      append: chai.spy(),
      getData: (): any => chai.spy(),
      getDataId: (options: any): any => {
        if (!options) {
          return emptyDataIdResult;
        }
        return testTopics;
      },
      read: (param: string): any => {
        const dataIdBlock2txFake: StorageTypes.IOneContentAndMeta = {
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
      await dataAccess.getTransactionsByTopic(arbitraryTopic1),
      'result with arbitraryTopic1 not empty',
    ).to.deep.equal({
      meta: {
        storageMeta: [],
        transactionsStorageLocation: [],
      },
      result: { transactions: [] },
    });

    // Transactions should be available avec synchronization
    await expect(dataAccess.synchronizeNewDataIds()).to.be.fulfilled;

    expect(
      await dataAccess.getTransactionsByTopic(arbitraryTopic1),
      'result with arbitraryTopic1 wrong',
    ).to.deep.equal({
      meta: {
        storageMeta: [{ timestamp: 1 }],
        transactionsStorageLocation: ['dataIdBlock2tx'],
      },
      result: { transactions: [{ transaction: transactionMock1, timestamp: 1 }] },
    });

    expect(
      await dataAccess.getTransactionsByTopic(arbitraryTopic2),
      'result with arbitraryTopic2 wrong',
    ).to.deep.equal({
      meta: {
        storageMeta: [{ timestamp: 1 }, { timestamp: 1 }],
        transactionsStorageLocation: ['dataIdBlock2tx', 'dataIdBlock2tx'],
      },
      result: {
        transactions: [
          { transaction: transactionMock1, timestamp: 1 },
          { transaction: transactionMock2, timestamp: 1 },
        ],
      },
    });
  });

  it('startSynchronizationTimer() should throw an error if not initialized', async () => {
    const fakeStorageSpied: StorageTypes.IStorage = {
      append: chai.spy.returns(appendResult),
      getData: (): any => chai.spy(),
      getDataId: chai.spy.returns({ result: { dataIds: [] } }),
      read: chai.spy(),
    };
    const dataAccess = new DataAccess(fakeStorageSpied);

    expect(() => dataAccess.startAutoSynchronization()).to.throw('DataAccess must be initialized');
  });

  it('allows to get new transactions automatically if startSynchronizationTimer() is called', async () => {
    const fakeStorage: StorageTypes.IStorage = {
      append: chai.spy(),
      getData: (): any => chai.spy(),
      getDataId: (): any => emptyDataIdResult,
      read: (param: string): any => {
        const dataIdBlock2txFake: StorageTypes.IOneContentAndMeta = {
          meta: { timestamp: 1 },
          result: { content: JSON.stringify(blockWith2tx) },
        };
        const result: any = {
          dataIdBlock2tx: dataIdBlock2txFake,
        };
        return result[param];
      },
    };

    const dataAccess = new DataAccess(fakeStorage, 1000);
    dataAccess.synchronizeNewDataIds = chai.spy();
    await dataAccess.initialize();

    expect(dataAccess.synchronizeNewDataIds).to.have.been.called.exactly(0);

    dataAccess.startAutoSynchronization();
    clock.tick(1100);

    // Should have been called once after 1100ms
    expect(dataAccess.synchronizeNewDataIds).to.have.been.called.exactly(1);

    dataAccess.stopAutoSynchronization();
    clock.tick(1000);

    // Not called anymore after stopAutoSynchronization()
    expect(dataAccess.synchronizeNewDataIds).to.have.been.called.exactly(1);
  });
});
