import 'mocha';

const chai = require('chai');
const spies = require('chai-spies');

const expect = chai.expect;
chai.use(spies);

import {
  DataAccess as DataAccessTypes,
  Signature as SignatureTypes,
  Storage as StorageTypes,
} from '@requestnetwork/types';

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
const signatureMock = {
  method: SignatureTypes.REQUEST_SIGNATURE_METHOD.ECDSA,
  value:
    '0xe649fdfe25c3ee33061a8159be9b941141121c5bed8d07664cb67b7912819b4539841a206636c190178ac58978926dad1fe3637a10b656705b71bda5e187510c1b',
};

const transactionMock1: DataAccessTypes.IRequestDataAccessTransaction = {
  data: transactionDataMock1String,
  signature: signatureMock,
};
const transactionMock2: DataAccessTypes.IRequestDataAccessTransaction = {
  data: transactionDataMock2String,
  signature: signatureMock,
};

const arbitraryTopic1 = '0xaaaaaa';
const arbitraryTopic2 = '0xccccccccccc';

const emptyblock = RequestDataAccessBlock.createEmptyBlock();
const blockWith1tx = RequestDataAccessBlock.pushTransaction(emptyblock, transactionMock1, [
  arbitraryTopic1,
  arbitraryTopic2,
]);
const blockWith2tx = RequestDataAccessBlock.pushTransaction(blockWith1tx, transactionMock2, [
  arbitraryTopic2,
]);

const dataIdBlock2tx = 'dataIdBlock2tx';

const getAllDataIdResult: StorageTypes.IRequestStorageGetAllDataIdReturn = {
  meta: {
    metaDataIds: [],
  },
  result: {
    dataIds: [dataIdBlock2tx],
  },
};

const appendResult: StorageTypes.IRequestStorageOneDataIdAndMeta = {
  meta: {},
  result: {
    dataId: dataIdBlock2tx,
  },
};

/* tslint:disable:no-unused-expression */
describe('data-access', () => {
  describe('constructor and getTransactionsByTopic', () => {
    it('cannot initialize with data from read without result', async () => {
      const testTopics: Promise<StorageTypes.IRequestStorageGetAllDataIdReturn> = Promise.resolve(
        getAllDataIdResult,
      );

      const fakeStorage: StorageTypes.IStorage = {
        append: chai.spy(),
        getAllData: (): any => chai.spy(),
        getAllDataId: (): any => testTopics,
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

      try {
        await dataAccess.initialize();
        expect(false, 'exception not thrown').to.be.true;
      } catch (e) {
        expect(e.message, 'exception not right').to.be.equal(
          'data from storage do not follow the standard, result is missing',
        );
      }
    });

    it('cannot initialize with data from getDataId without result', async () => {
      const testTopics: Promise<any> = Promise.resolve({
        meta: {
          metaDataIds: [],
        },
      });

      const fakeStorage: StorageTypes.IStorage = {
        append: chai.spy(),
        getAllData: (): any => chai.spy(),
        getAllDataId: (): any => testTopics,
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

      try {
        await dataAccess.initialize();
        expect(false, 'exception not thrown').to.be.true;
      } catch (e) {
        expect(e.message, 'exception not right').to.be.equal(
          'data from storage do not follow the standard, result is missing',
        );
      }
    });

    it('cannot initialize with content from read not following the standard', async () => {
      const testTopics: Promise<StorageTypes.IRequestStorageGetAllDataIdReturn> = Promise.resolve(
        getAllDataIdResult,
      );

      const fakeStorage: StorageTypes.IStorage = {
        append: chai.spy(),
        getAllData: (): any => chai.spy(),
        getAllDataId: (): any => testTopics,
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

      try {
        await dataAccess.initialize();
        expect(false, 'exception not thrown').to.be.true;
      } catch (e) {
        expect(e.message, 'exception not right').to.be.equal(
          'data from storage do not follow the standard, storage location: "dataIdBlock2tx"',
        );
      }
    });

    it('can construct and getTransactionsByTopic', async () => {
      const testTopics: Promise<StorageTypes.IRequestStorageGetAllDataIdReturn> = Promise.resolve(
        getAllDataIdResult,
      );

      const fakeStorage: StorageTypes.IStorage = {
        append: chai.spy(),
        getAllData: (): any => chai.spy(),
        getAllDataId: (): any => testTopics,
        read: (param: string): any => {
          const dataIdBlock2txFake: StorageTypes.IRequestStorageOneContentAndMeta = {
            meta: {},
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
          storageMeta: [{}],
          transactionsStorageLocation: ['dataIdBlock2tx'],
        },
        result: { transactions: [transactionMock1] },
      });

      expect(
        await dataAccess.getTransactionsByTopic(arbitraryTopic2),
        'result with arbitraryTopic2 wrong',
      ).to.deep.equal({
        meta: {
          storageMeta: [{}, {}],
          transactionsStorageLocation: ['dataIdBlock2tx', 'dataIdBlock2tx'],
        },
        result: {
          transactions: [transactionMock1, transactionMock2],
        },
      });
    });

    it('cannot initialize twice', async () => {
      const testTopics: Promise<StorageTypes.IRequestStorageGetAllDataIdReturn> = Promise.resolve(
        getAllDataIdResult,
      );

      const fakeStorage: StorageTypes.IStorage = {
        append: chai.spy(),
        getAllData: (): any => chai.spy(),
        getAllDataId: (): any => testTopics,
        read: (param: string): any => {
          const dataIdBlock2txFake: StorageTypes.IRequestStorageOneContentAndMeta = {
            meta: {},
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

      try {
        await dataAccess.initialize();
        expect(false, 'exception not thrown').to.be.true;
      } catch (e) {
        expect(e.message, 'exception not right').to.be.equal('already initialized');
      }
    });

    it('cannot getTransactionsByTopic if not initialized', async () => {
      const testTopics: Promise<StorageTypes.IRequestStorageGetAllDataIdReturn> = Promise.resolve(
        getAllDataIdResult,
      );

      const fakeStorage: StorageTypes.IStorage = {
        append: chai.spy(),
        getAllData: (): any => chai.spy(),
        getAllDataId: (): any => testTopics,
        read: (param: string): any => {
          const dataIdBlock2txFake: StorageTypes.IRequestStorageOneContentAndMeta = {
            meta: {},
            result: { content: JSON.stringify(blockWith2tx) },
          };
          const result: any = {
            dataIdBlock2tx: dataIdBlock2txFake,
          };
          return result[param];
        },
      };

      const dataAccess = new DataAccess(fakeStorage);

      try {
        await dataAccess.getTransactionsByTopic(arbitraryTopic1);
        expect(false, 'exception not thrown').to.be.true;
      } catch (e) {
        expect(e.message, 'exception not right').to.be.equal('DataAccess must be initialized');
      }
    });
  });

  describe('persistTransaction', () => {
    it('can persistTransaction()', async () => {
      const fakeStorageSpied: StorageTypes.IStorage = {
        append: chai.spy.returns(appendResult),
        getAllData: (): any => chai.spy(),
        getAllDataId: chai.spy.returns({ result: { dataIds: [] } }),
        read: chai.spy(),
      };
      const dataAccess = new DataAccess(fakeStorageSpied);
      await dataAccess.initialize();

      const result = await dataAccess.persistTransaction(transactionMock1, [arbitraryTopic1]);

      /* tslint:disable:object-literal-sort-keys  */
      /* tslint:disable:object-literal-key-quotes  */
      expect(fakeStorageSpied.append).to.have.been.called.with(
        JSON.stringify({
          header: {
            topics: {
              '0xaaaaaa': [0],
              '0xc23dc7c66c4b91a3a53f9a052ab8c359fd133c8ddf976aab57f296ffd9d4a2ca': [0],
            },
            version: '0.1.0',
          },
          transactions: [
            {
              data: '{"attribut1":"plop","attribut2":"value"}',
              signature: {
                method: 'ecdsa',
                value:
                  '0xe649fdfe25c3ee33061a8159be9b941141121c5bed8d07664cb67b7912819b4539841a206636c190178ac58978926dad1fe3637a10b656705b71bda5e187510c1b',
              },
            },
          ],
        }),
      );
      expect(result, 'result wrong').to.deep.equal({
        meta: {
          storageMeta: {},
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
        getAllData: (): any => chai.spy(),
        getAllDataId: chai.spy.returns([]),
        read: chai.spy(),
      };
      const dataAccess = new DataAccess(fakeStorageSpied);

      try {
        await dataAccess.persistTransaction(transactionMock1, [arbitraryTopic1]);
        expect(false, 'exception not thrown').to.be.true;
      } catch (e) {
        expect(e.message, 'exception not right').to.be.equal('DataAccess must be initialized');
      }
    });
  });
});
