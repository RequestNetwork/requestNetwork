import { DataAccessTypes } from '@requestnetwork/types';
import RequestDataAccessBlock from '../src/block';

const CURRENT_VERSION = '0.1.0';
const transactionDataMock1String = JSON.stringify({
  attribut1: 'plop',
  attribut2: 'value',
});

const transactionDataMock2String = JSON.stringify({
  attribut1: 'foo',
  attribut2: 'bar',
});

const transactionMock: DataAccessTypes.ITransaction = {
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
  transactionMock,
  arbitraryId1,
  [arbitraryTopic1, arbitraryTopic2],
);
const blockWith2tx = RequestDataAccessBlock.pushTransaction(
  blockWith1tx,
  transactionMock2,
  arbitraryId2,
  [arbitraryTopic2],
);

/* tslint:disable:no-unused-expression */
describe('block', () => {
  describe('createEmptyBlock', () => {
    it('can create an empty block', () => {
      const emptyblock1 = RequestDataAccessBlock.createEmptyBlock();
      // 'header is wrong'
      expect(emptyblock1.header).toEqual({
        channelIds: {},
        topics: {},
        version: CURRENT_VERSION,
      });
      // 'transactions are wrong'
      expect(emptyblock1.transactions).toEqual([]);
    });
  });

  describe('pushTransaction', () => {
    it('can pushTransaction with topics an empty block', () => {
      const newBlock = RequestDataAccessBlock.pushTransaction(
        emptyblock,
        transactionMock,
        arbitraryId1,
        [arbitraryTopic1, arbitraryTopic2],
      );
      // empty block mush remain empty
      // 'previous header must not change'
      expect(emptyblock.header).toEqual({
        channelIds: {},
        topics: {},
        version: CURRENT_VERSION,
      });
      // 'previous transactions must not change'
      expect(emptyblock.transactions).toEqual([]);

      // 'header is wrong'
      expect(newBlock.header).toEqual({
        channelIds: {
          [arbitraryId1]: [0],
        },
        topics: {
          [arbitraryId1]: [arbitraryTopic1, arbitraryTopic2],
        },
        version: CURRENT_VERSION,
      });
      // 'transactions are wrong'
      expect(newBlock.transactions).toEqual([transactionMock]);
    });
    it('can pushTransaction with topics a NOT empty block', () => {
      const previousBlock = RequestDataAccessBlock.pushTransaction(
        emptyblock,
        transactionMock,
        arbitraryId1,
      );

      const newBlock = RequestDataAccessBlock.pushTransaction(
        previousBlock,
        transactionMock2,
        arbitraryId2,
        [arbitraryTopic1, arbitraryTopic2],
      );

      // 'previous header must not change'
      expect(previousBlock.header).toEqual({
        channelIds: {
          [arbitraryId1]: [0],
        },
        topics: {},
        version: CURRENT_VERSION,
      });
      // 'transactions are wrong'
      expect(previousBlock.transactions).toEqual([
        transactionMock,
      ]);

      // 'header is wrong'
      expect(newBlock.header).toEqual({
        channelIds: {
          [arbitraryId1]: [0],
          [arbitraryId2]: [1],
        },
        topics: {
          [arbitraryId2]: [arbitraryTopic1, arbitraryTopic2],
        },
        version: CURRENT_VERSION,
      });
      // 'transactions are wrong'
      expect(newBlock.transactions).toEqual([
        transactionMock,
        transactionMock2,
      ]);
    });
    it('can pushTransaction without topics on an empty block', () => {
      const newBlock = RequestDataAccessBlock.pushTransaction(
        emptyblock,
        transactionMock,
        arbitraryId1,
      );
      // empty block mush remain empty
      // 'previous header must not change'
      expect(emptyblock.header).toEqual({
        channelIds: {},
        topics: {},
        version: CURRENT_VERSION,
      });
      // 'previous transactions must not change'
      expect(emptyblock.transactions).toEqual([]);

      // 'header is wrong'
      expect(newBlock.header).toEqual({
        channelIds: {
          [arbitraryId1]: [0],
        },
        topics: {},
        version: CURRENT_VERSION,
      });
      // 'transactions are wrong'
      expect(newBlock.transactions).toEqual([transactionMock]);
    });
    it('can pushTransaction without topics on a NOT empty block', () => {
      const previousBlock = RequestDataAccessBlock.pushTransaction(
        emptyblock,
        transactionMock,
        arbitraryId1,
      );
      const newBlock = RequestDataAccessBlock.pushTransaction(
        previousBlock,
        transactionMock2,
        arbitraryId2,
      );

      // 'previous header must not change'
      expect(previousBlock.header).toEqual({
        channelIds: {
          [arbitraryId1]: [0],
        },
        topics: {},
        version: CURRENT_VERSION,
      });
      // 'transactions are wrong'
      expect(previousBlock.transactions).toEqual([
        transactionMock,
      ]);

      // 'header is wrong'
      expect(newBlock.header).toEqual({
        channelIds: {
          [arbitraryId1]: [0],
          [arbitraryId2]: [1],
        },
        topics: {},
        version: CURRENT_VERSION,
      });
      // 'transactions are wrong'
      expect(newBlock.transactions).toEqual([
        transactionMock,
        transactionMock2,
      ]);
    });
    it('can pushTransaction with topics with topics already existing', () => {
      const newBlock = RequestDataAccessBlock.pushTransaction(
        blockWith1tx,
        transactionMock2,
        arbitraryId2,
        [arbitraryTopic2],
      );

      // 'header is wrong'
      expect(newBlock.header).toEqual({
        channelIds: {
          [arbitraryId1]: [0],
          [arbitraryId2]: [1],
        },
        topics: {
          [arbitraryId1]: [arbitraryTopic1, arbitraryTopic2],
          [arbitraryId2]: [arbitraryTopic2],
        },
        version: CURRENT_VERSION,
      });
      // 'transactions are wrong'
      expect(newBlock.transactions).toEqual([
        transactionMock,
        transactionMock2,
      ]);
    });
    it('cannot pushTransaction without property data', () => {
      // 'must throw'
      expect(() => {
        RequestDataAccessBlock.pushTransaction(
          emptyblock,
          { noData: 'here' } as any,
          arbitraryId1,
          [],
        );
      }).toThrowError('The transaction is missing the data property');
    });
  });

  describe('getAllTransactions', () => {
    it('can getAllTransactions on empty block', () => {
      const allTxs = RequestDataAccessBlock.getAllTransactions(emptyblock);
      // 'transactions must be empty'
      expect(allTxs).toEqual([]);
    });
    it('can getAllTransactions on NOT empty block', () => {
      let newBlock = RequestDataAccessBlock.pushTransaction(
        emptyblock,
        transactionMock,
        arbitraryId1,
        [arbitraryTopic1, arbitraryTopic2],
      );
      newBlock = RequestDataAccessBlock.pushTransaction(newBlock, transactionMock2, arbitraryId2);
      const allTxs = RequestDataAccessBlock.getAllTransactions(newBlock);
      // 'transactions must be empty'
      expect(allTxs).toEqual([
        transactionMock,
        transactionMock2,
      ]);
    });
  });

  describe('getAllTopic', () => {
    it('can getAllTopic on empty block', () => {
      const allTopices = RequestDataAccessBlock.getAllTopics(emptyblock);
      // 'transactions must be empty'
      expect(allTopices).toEqual({});
    });
    it('can getAllTopic on NOT empty block', () => {
      const allTopices = RequestDataAccessBlock.getAllTopics(blockWith2tx);
      // 'transactions must be empty'
      expect(allTopices).toEqual({
        [arbitraryId1]: [arbitraryTopic1, arbitraryTopic2],
        [arbitraryId2]: [arbitraryTopic2],
      });
    });
  });

  describe('getAllChannelIds', () => {
    it('can getAllChannelIds on empty block', () => {
      const allIds = RequestDataAccessBlock.getAllChannelIds(emptyblock);
      // 'transactions must be empty'
      expect(allIds).toEqual({});
    });
    it('can getAllChannelIds on NOT empty block', () => {
      const allIds = RequestDataAccessBlock.getAllChannelIds(blockWith2tx);
      // 'transactions must be empty'
      expect(allIds).toEqual({
        [arbitraryId1]: [0],
        [arbitraryId2]: [1],
      });
    });
  });

  describe('getTransactionFromPosition', () => {
    it('can getTransactionFromPosition on an empty block', () => {
      const tx = RequestDataAccessBlock.getTransactionFromPosition(emptyblock, 0);
      // 'tx must be undefined'
      expect(tx).toBeUndefined();
    });
    it('can getTransactionFromPosition with transaction existing', () => {
      const tx = RequestDataAccessBlock.getTransactionFromPosition(blockWith1tx, 0);

      // 'transactions is wrong'
      expect(tx).toEqual(transactionMock);
    });
  });

  describe('getTransactionPositionFromChannelId', () => {
    it('can getTransactionPositionFromChannelId on an empty block', () => {
      const txTopic = RequestDataAccessBlock.getTransactionPositionFromChannelId(
        emptyblock,
        arbitraryId1,
      );
      // 'txTopic is wrong'
      expect(txTopic).toEqual([]);
    });
    it('can getTransactionPositionFromChannelId with topics existing', () => {
      const txTopic = RequestDataAccessBlock.getTransactionPositionFromChannelId(
        blockWith1tx,
        arbitraryId1,
      );
      // 'txTopic is wrong'
      expect(txTopic).toEqual([0]);
    });
  });

  describe('getTransactionsByPositions', () => {
    it('can getTransactionsByPositions on an empty block', () => {
      const txs = RequestDataAccessBlock.getTransactionsByPositions(emptyblock, [0, 1]);
      // 'txs must be empty'
      expect(txs).toEqual([]);
    });
    it('can getTransactionsByPositions on missing transaction', () => {
      const txs = RequestDataAccessBlock.getTransactionsByPositions(blockWith1tx, [0, 1]);
      // 'txs is wrong'
      expect(txs).toEqual([transactionMock]);
    });
    it('can getTransactionsByPositions on more than one transaction', () => {
      const txs = RequestDataAccessBlock.getTransactionsByPositions(blockWith2tx, [0, 1]);
      // 'txs is wrong'
      expect(txs).toEqual([transactionMock, transactionMock2]);
    });
    it(
      'can getTransactionsByPositions on more than one transaction with array not sorted',
      () => {
        const txs = RequestDataAccessBlock.getTransactionsByPositions(blockWith2tx, [1, 0]);
        // 'txs is wrong'
        expect(txs).toEqual([transactionMock, transactionMock2]);
      }
    );
    it(
      'can getTransactionsByPositions on more than one transaction with array duplication',
      () => {
        const txs = RequestDataAccessBlock.getTransactionsByPositions(blockWith2tx, [
          1,
          1,
          0,
          1,
          0,
          0,
        ]);
        // 'txs is wrong'
        expect(txs).toEqual([transactionMock, transactionMock2]);
      }
    );
  });

  describe('getTransactionPositionsByChannelIds', () => {
    it('can getTransactionPositionsByChannelIds on an empty block', () => {
      const txs = RequestDataAccessBlock.getTransactionPositionsByChannelIds(emptyblock, [
        arbitraryId1,
        arbitraryId2,
      ]);
      // 'txs must be empty'
      expect(txs).toEqual([]);
    });
    it('can getTransactionPositionsByChannelIds on missing transaction', () => {
      const txs = RequestDataAccessBlock.getTransactionPositionsByChannelIds(blockWith1tx, [
        arbitraryId1,
        arbitraryId2,
      ]);
      // 'txs is wrong'
      expect(txs).toEqual([0]);
    });
    it(
      'can getTransactionPositionsByChannelIds on more than one transaction',
      () => {
        const txs = RequestDataAccessBlock.getTransactionPositionsByChannelIds(blockWith2tx, [
          arbitraryId1,
          arbitraryId2,
        ]);
        // 'txs is wrong'
        expect(txs).toEqual([0, 1]);
      }
    );
    it(
      'can getTransactionPositionsByChannelIds on more than one transaction with array not sorted',
      () => {
        const txs = RequestDataAccessBlock.getTransactionPositionsByChannelIds(blockWith2tx, [
          arbitraryId2,
          arbitraryId1,
        ]);
        // 'txs is wrong'
        expect(txs).toEqual([0, 1]);
      }
    );
    it(
      'can getTransactionPositionsByChannelIds on more than one transaction with array duplication',
      () => {
        const txs = RequestDataAccessBlock.getTransactionPositionsByChannelIds(blockWith2tx, [
          arbitraryId2,
          arbitraryId1,
          arbitraryId2,
          arbitraryId2,
          arbitraryId1,
          arbitraryId1,
          arbitraryId1,
        ]);
        // 'txs is wrong'
        expect(txs).toEqual([0, 1]);
      }
    );
  });

  describe('parseBlock', () => {
    it('can parse a data', async () => {
      const block = RequestDataAccessBlock.parseBlock(JSON.stringify(blockWith2tx));
      expect(block).toEqual(blockWith2tx);
    });

    it('cannot parse a data not following the block standard', async () => {
      const blockNotJson = 'This is not JSON';
      expect(() => RequestDataAccessBlock.parseBlock(blockNotJson)).toThrowError(`Impossible to JSON parse the data: `);

      const blockWithoutHeader = {
        transactions: [{ data: 'any data' }],
      };
      expect(() => RequestDataAccessBlock.parseBlock(JSON.stringify(blockWithoutHeader))).toThrowError(`Data do not follow the block standard`);

      const blockWithoutChannelIds = {
        header: { topics: {}, version: '0.1.0' },
        transactions: [{ data: 'any data' }],
      };
      expect(() =>
        RequestDataAccessBlock.parseBlock(JSON.stringify(blockWithoutChannelIds)),
      ).toThrowError(`Header do not follow the block standard`);

      const blockWithoutTopics = {
        header: { channelIds: {}, version: '0.1.0' },
        transactions: [{ data: 'any data' }],
      };
      expect(() => RequestDataAccessBlock.parseBlock(JSON.stringify(blockWithoutTopics))).toThrowError(`Header do not follow the block standard`);

      const blockWithoutVersion = {
        header: { channelIds: {}, topics: {} },
        transactions: [{ data: 'any data' }],
      };
      expect(() => RequestDataAccessBlock.parseBlock(JSON.stringify(blockWithoutVersion))).toThrowError(`Header do not follow the block standard`);

      const blockWithoutTransactions = {
        header: { channelIds: {}, topics: {}, version: '0.1.0' },
      };
      expect(() =>
        RequestDataAccessBlock.parseBlock(JSON.stringify(blockWithoutTransactions)),
      ).toThrowError(`Data do not follow the block standard`);

      const blockWithoutTransactionData = {
        header: { channelIds: {}, topics: {}, version: '0.1.0' },
        transactions: [{}],
      };
      expect(() =>
        RequestDataAccessBlock.parseBlock(JSON.stringify(blockWithoutTransactionData)),
      ).toThrowError(`Transactions do not follow the block standard`);

      const blockWrongVersion = {
        header: { channelIds: {}, topics: {}, version: '0.0.0' },
        transactions: [{ data: 'any data' }],
      };
      expect(() => RequestDataAccessBlock.parseBlock(JSON.stringify(blockWrongVersion))).toThrowError(`Version not supported`);

      const blockWithChannelIdNotHash = {
        header: { channelIds: { ['0x111']: [0] }, topics: {}, version: '0.1.0' },
        transactions: [{ data: 'any data' }],
      };
      expect(() =>
        RequestDataAccessBlock.parseBlock(JSON.stringify(blockWithChannelIdNotHash)),
      ).toThrowError(`Channel ids in header.channelIds must be formatted keccak256 hashes`);

      const blockWithTxPositionNotExisting = {
        header: { channelIds: { [arbitraryId1]: [1] }, topics: {}, version: '0.1.0' },
        transactions: [{ data: 'any data' }],
      };
      expect(() =>
        RequestDataAccessBlock.parseBlock(JSON.stringify(blockWithTxPositionNotExisting)),
      ).toThrowError(`transactions in channel ids must refer to transaction in the blocks`);

      const blockWithNegativePosition = {
        header: { channelIds: { [arbitraryId1]: [-1] }, topics: {}, version: '0.1.0' },
        transactions: [{ data: 'any data' }],
      };
      expect(() =>
        RequestDataAccessBlock.parseBlock(JSON.stringify(blockWithNegativePosition)),
      ).toThrowError(`transactions in channel ids must refer to transaction in the blocks`);

      const blockWithChannelIdInTopicsNotHash = {
        header: { channelIds: {}, topics: { ['Ox111']: [arbitraryTopic1] }, version: '0.1.0' },
        transactions: [{ data: 'any data' }],
      };
      expect(() =>
        RequestDataAccessBlock.parseBlock(JSON.stringify(blockWithChannelIdInTopicsNotHash)),
      ).toThrowError(`Channel ids in header.topics must be formatted keccak256 hashes`);

      const blockWithTopicsNotHash = {
        header: { channelIds: {}, topics: { [arbitraryId1]: ['0x111'] }, version: '0.1.0' },
        transactions: [{ data: 'any data' }],
      };
      expect(() =>
        RequestDataAccessBlock.parseBlock(JSON.stringify(blockWithTopicsNotHash)),
      ).toThrowError(`topics in header.topics must be formatted keccak256 hashes`);
    });
  });

  describe('can use JSON', () => {
    it('can use JSON.stringify and JSON.parse', () => {
      const block = RequestDataAccessBlock.pushTransaction(
        blockWith1tx,
        transactionMock2,
        arbitraryId2,
        [arbitraryTopic2],
      );
      /* tslint:disable:object-literal-sort-keys  */
      /* tslint:disable:object-literal-key-quotes  */
      const strExpected = JSON.stringify({
        header: {
          channelIds: {
            [arbitraryId1]: [0],
            [arbitraryId2]: [1],
          },
          topics: {
            [arbitraryId1]: [arbitraryTopic1, arbitraryTopic2],
            [arbitraryId2]: [arbitraryTopic2],
          },
          version: '0.1.0',
        },
        transactions: [
          {
            data: '{"attribut1":"plop","attribut2":"value"}',
          },
          {
            data: '{"attribut1":"foo","attribut2":"bar"}',
          },
        ],
      });
      // 'Error stringify-ing a block'
      expect(JSON.stringify(block)).toBe(strExpected);

      // 'Error parsing a block'
      expect(JSON.parse(strExpected)).toEqual(block);
    });
  });
});
