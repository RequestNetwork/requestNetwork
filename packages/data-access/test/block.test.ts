import { expect } from 'chai';
import 'mocha';

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
      expect(emptyblock1.header, 'header is wrong').to.be.deep.equal({
        channelIds: {},
        topics: {},
        version: CURRENT_VERSION,
      });
      expect(emptyblock1.transactions, 'transactions are wrong').to.be.deep.equal([]);
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
      expect(emptyblock.header, 'previous header must not change').to.be.deep.equal({
        channelIds: {},
        topics: {},
        version: CURRENT_VERSION,
      });
      expect(emptyblock.transactions, 'previous transactions must not change').to.be.deep.equal([]);

      expect(newBlock.header, 'header is wrong').to.be.deep.equal({
        channelIds: {
          [arbitraryId1]: [0],
        },
        topics: {
          [arbitraryId1]: [arbitraryTopic1, arbitraryTopic2],
        },
        version: CURRENT_VERSION,
      });
      expect(newBlock.transactions, 'transactions are wrong').to.be.deep.equal([transactionMock]);
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

      expect(previousBlock.header, 'previous header must not change').to.be.deep.equal({
        channelIds: {
          [arbitraryId1]: [0],
        },
        topics: {},
        version: CURRENT_VERSION,
      });
      expect(previousBlock.transactions, 'transactions are wrong').to.be.deep.equal([
        transactionMock,
      ]);

      expect(newBlock.header, 'header is wrong').to.be.deep.equal({
        channelIds: {
          [arbitraryId1]: [0],
          [arbitraryId2]: [1],
        },
        topics: {
          [arbitraryId2]: [arbitraryTopic1, arbitraryTopic2],
        },
        version: CURRENT_VERSION,
      });
      expect(newBlock.transactions, 'transactions are wrong').to.be.deep.equal([
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
      expect(emptyblock.header, 'previous header must not change').to.be.deep.equal({
        channelIds: {},
        topics: {},
        version: CURRENT_VERSION,
      });
      expect(emptyblock.transactions, 'previous transactions must not change').to.be.deep.equal([]);

      expect(newBlock.header, 'header is wrong').to.be.deep.equal({
        channelIds: {
          [arbitraryId1]: [0],
        },
        topics: {},
        version: CURRENT_VERSION,
      });
      expect(newBlock.transactions, 'transactions are wrong').to.be.deep.equal([transactionMock]);
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

      expect(previousBlock.header, 'previous header must not change').to.be.deep.equal({
        channelIds: {
          [arbitraryId1]: [0],
        },
        topics: {},
        version: CURRENT_VERSION,
      });
      expect(previousBlock.transactions, 'transactions are wrong').to.be.deep.equal([
        transactionMock,
      ]);

      expect(newBlock.header, 'header is wrong').to.be.deep.equal({
        channelIds: {
          [arbitraryId1]: [0],
          [arbitraryId2]: [1],
        },
        topics: {},
        version: CURRENT_VERSION,
      });
      expect(newBlock.transactions, 'transactions are wrong').to.be.deep.equal([
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

      expect(newBlock.header, 'header is wrong').to.be.deep.equal({
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
      expect(newBlock.transactions, 'transactions are wrong').to.be.deep.equal([
        transactionMock,
        transactionMock2,
      ]);
    });
    it('cannot pushTransaction without property data', () => {
      expect(() => {
        RequestDataAccessBlock.pushTransaction(
          emptyblock,
          { noData: 'here' } as any,
          arbitraryId1,
          [],
        );
      }, 'must throw').to.throw('The transaction is missing the data property');
    });
  });

  describe('getAllTransactions', () => {
    it('can getAllTransactions on empty block', () => {
      const allTxs = RequestDataAccessBlock.getAllTransactions(emptyblock);
      expect(allTxs, 'transactions must be empty').to.be.deep.equal([]);
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
      expect(allTxs, 'transactions must be empty').to.be.deep.equal([
        transactionMock,
        transactionMock2,
      ]);
    });
  });

  describe('getAllTopic', () => {
    it('can getAllTopic on empty block', () => {
      const allTopices = RequestDataAccessBlock.getAllTopics(emptyblock);
      expect(allTopices, 'transactions must be empty').to.be.deep.equal({});
    });
    it('can getAllTopic on NOT empty block', () => {
      const allTopices = RequestDataAccessBlock.getAllTopics(blockWith2tx);
      expect(allTopices, 'transactions must be empty').to.be.deep.equal({
        [arbitraryId1]: [arbitraryTopic1, arbitraryTopic2],
        [arbitraryId2]: [arbitraryTopic2],
      });
    });
  });

  describe('getAllChannelIds', () => {
    it('can getAllChannelIds on empty block', () => {
      const allIds = RequestDataAccessBlock.getAllChannelIds(emptyblock);
      expect(allIds, 'transactions must be empty').to.be.deep.equal({});
    });
    it('can getAllChannelIds on NOT empty block', () => {
      const allIds = RequestDataAccessBlock.getAllChannelIds(blockWith2tx);
      expect(allIds, 'transactions must be empty').to.be.deep.equal({
        [arbitraryId1]: [0],
        [arbitraryId2]: [1],
      });
    });
  });

  describe('getTransactionFromPosition', () => {
    it('can getTransactionFromPosition on an empty block', () => {
      const tx = RequestDataAccessBlock.getTransactionFromPosition(emptyblock, 0);
      expect(tx, 'tx must be undefined').to.be.undefined;
    });
    it('can getTransactionFromPosition with transaction existing', () => {
      const tx = RequestDataAccessBlock.getTransactionFromPosition(blockWith1tx, 0);

      expect(tx, 'transactions is wrong').to.be.deep.equal(transactionMock);
    });
  });

  describe('getTransactionPositionFromChannelId', () => {
    it('can getTransactionPositionFromChannelId on an empty block', () => {
      const txTopic = RequestDataAccessBlock.getTransactionPositionFromChannelId(
        emptyblock,
        arbitraryId1,
      );
      expect(txTopic, 'txTopic is wrong').to.be.deep.equal([]);
    });
    it('can getTransactionPositionFromChannelId with topics existing', () => {
      const txTopic = RequestDataAccessBlock.getTransactionPositionFromChannelId(
        blockWith1tx,
        arbitraryId1,
      );
      expect(txTopic, 'txTopic is wrong').to.be.deep.equal([0]);
    });
  });

  describe('getTransactionsByPositions', () => {
    it('can getTransactionsByPositions on an empty block', () => {
      const txs = RequestDataAccessBlock.getTransactionsByPositions(emptyblock, [0, 1]);
      expect(txs, 'txs must be empty').to.be.deep.equal([]);
    });
    it('can getTransactionsByPositions on missing transaction', () => {
      const txs = RequestDataAccessBlock.getTransactionsByPositions(blockWith1tx, [0, 1]);
      expect(txs, 'txs is wrong').to.be.deep.equal([transactionMock]);
    });
    it('can getTransactionsByPositions on more than one transaction', () => {
      const txs = RequestDataAccessBlock.getTransactionsByPositions(blockWith2tx, [0, 1]);
      expect(txs, 'txs is wrong').to.be.deep.equal([transactionMock, transactionMock2]);
    });
    it('can getTransactionsByPositions on more than one transaction with array not sorted', () => {
      const txs = RequestDataAccessBlock.getTransactionsByPositions(blockWith2tx, [1, 0]);
      expect(txs, 'txs is wrong').to.be.deep.equal([transactionMock, transactionMock2]);
    });
    it('can getTransactionsByPositions on more than one transaction with array duplication', () => {
      const txs = RequestDataAccessBlock.getTransactionsByPositions(blockWith2tx, [
        1,
        1,
        0,
        1,
        0,
        0,
      ]);
      expect(txs, 'txs is wrong').to.be.deep.equal([transactionMock, transactionMock2]);
    });
  });

  describe('getTransactionPositionsByChannelIds', () => {
    it('can getTransactionPositionsByChannelIds on an empty block', () => {
      const txs = RequestDataAccessBlock.getTransactionPositionsByChannelIds(emptyblock, [
        arbitraryId1,
        arbitraryId2,
      ]);
      expect(txs, 'txs must be empty').to.be.deep.equal([]);
    });
    it('can getTransactionPositionsByChannelIds on missing transaction', () => {
      const txs = RequestDataAccessBlock.getTransactionPositionsByChannelIds(blockWith1tx, [
        arbitraryId1,
        arbitraryId2,
      ]);
      expect(txs, 'txs is wrong').to.be.deep.equal([0]);
    });
    it('can getTransactionPositionsByChannelIds on more than one transaction', () => {
      const txs = RequestDataAccessBlock.getTransactionPositionsByChannelIds(blockWith2tx, [
        arbitraryId1,
        arbitraryId2,
      ]);
      expect(txs, 'txs is wrong').to.be.deep.equal([0, 1]);
    });
    it('can getTransactionPositionsByChannelIds on more than one transaction with array not sorted', () => {
      const txs = RequestDataAccessBlock.getTransactionPositionsByChannelIds(blockWith2tx, [
        arbitraryId2,
        arbitraryId1,
      ]);
      expect(txs, 'txs is wrong').to.be.deep.equal([0, 1]);
    });
    it('can getTransactionPositionsByChannelIds on more than one transaction with array duplication', () => {
      const txs = RequestDataAccessBlock.getTransactionPositionsByChannelIds(blockWith2tx, [
        arbitraryId2,
        arbitraryId1,
        arbitraryId2,
        arbitraryId2,
        arbitraryId1,
        arbitraryId1,
        arbitraryId1,
      ]);
      expect(txs, 'txs is wrong').to.be.deep.equal([0, 1]);
    });
  });

  describe('parseBlock', () => {
    it('can parse a data', async () => {
      const block = RequestDataAccessBlock.parseBlock(JSON.stringify(blockWith2tx));
      expect(block).to.deep.equal(blockWith2tx);
    });

    it('cannot parse a data not following the block standard', async () => {
      const blockNotJson = 'This is not JSON';
      expect(() => RequestDataAccessBlock.parseBlock(blockNotJson)).to.throw(
        `Impossible to JSON parse the data: `,
      );

      const blockWithoutHeader = {
        transactions: [{ data: 'any data' }],
      };
      expect(() => RequestDataAccessBlock.parseBlock(JSON.stringify(blockWithoutHeader))).to.throw(
        `Data do not follow the block standard`,
      );

      const blockWithoutChannelIds = {
        header: { topics: {}, version: '0.1.0' },
        transactions: [{ data: 'any data' }],
      };
      expect(() =>
        RequestDataAccessBlock.parseBlock(JSON.stringify(blockWithoutChannelIds)),
      ).to.throw(`Header do not follow the block standard`);

      const blockWithoutTopics = {
        header: { channelIds: {}, version: '0.1.0' },
        transactions: [{ data: 'any data' }],
      };
      expect(() => RequestDataAccessBlock.parseBlock(JSON.stringify(blockWithoutTopics))).to.throw(
        `Header do not follow the block standard`,
      );

      const blockWithoutVersion = {
        header: { channelIds: {}, topics: {} },
        transactions: [{ data: 'any data' }],
      };
      expect(() => RequestDataAccessBlock.parseBlock(JSON.stringify(blockWithoutVersion))).to.throw(
        `Header do not follow the block standard`,
      );

      const blockWithoutTransactions = {
        header: { channelIds: {}, topics: {}, version: '0.1.0' },
      };
      expect(() =>
        RequestDataAccessBlock.parseBlock(JSON.stringify(blockWithoutTransactions)),
      ).to.throw(`Data do not follow the block standard`);

      const blockWithoutTransactionData = {
        header: { channelIds: {}, topics: {}, version: '0.1.0' },
        transactions: [{}],
      };
      expect(() =>
        RequestDataAccessBlock.parseBlock(JSON.stringify(blockWithoutTransactionData)),
      ).to.throw(`Transactions do not follow the block standard`);

      const blockWrongVersion = {
        header: { channelIds: {}, topics: {}, version: '0.0.0' },
        transactions: [{ data: 'any data' }],
      };
      expect(() => RequestDataAccessBlock.parseBlock(JSON.stringify(blockWrongVersion))).to.throw(
        `Version not supported`,
      );

      const blockWithChannelIdNotHash = {
        header: { channelIds: { ['0x111']: [0] }, topics: {}, version: '0.1.0' },
        transactions: [{ data: 'any data' }],
      };
      expect(() =>
        RequestDataAccessBlock.parseBlock(JSON.stringify(blockWithChannelIdNotHash)),
      ).to.throw(`Channel ids in header.channelIds must be formatted keccak256 hashes`);

      const blockWithTxPositionNotExisting = {
        header: { channelIds: { [arbitraryId1]: [1] }, topics: {}, version: '0.1.0' },
        transactions: [{ data: 'any data' }],
      };
      expect(() =>
        RequestDataAccessBlock.parseBlock(JSON.stringify(blockWithTxPositionNotExisting)),
      ).to.throw(`transactions in channel ids must refer to transaction in the blocks`);

      const blockWithNegativePosition = {
        header: { channelIds: { [arbitraryId1]: [-1] }, topics: {}, version: '0.1.0' },
        transactions: [{ data: 'any data' }],
      };
      expect(() =>
        RequestDataAccessBlock.parseBlock(JSON.stringify(blockWithNegativePosition)),
      ).to.throw(`transactions in channel ids must refer to transaction in the blocks`);

      const blockWithChannelIdInTopicsNotHash = {
        header: { channelIds: {}, topics: { ['Ox111']: [arbitraryTopic1] }, version: '0.1.0' },
        transactions: [{ data: 'any data' }],
      };
      expect(() =>
        RequestDataAccessBlock.parseBlock(JSON.stringify(blockWithChannelIdInTopicsNotHash)),
      ).to.throw(`Channel ids in header.topics must be formatted keccak256 hashes`);

      const blockWithTopicsNotHash = {
        header: { channelIds: {}, topics: { [arbitraryId1]: ['0x111'] }, version: '0.1.0' },
        transactions: [{ data: 'any data' }],
      };
      expect(() =>
        RequestDataAccessBlock.parseBlock(JSON.stringify(blockWithTopicsNotHash)),
      ).to.throw(`topics in header.topics must be formatted keccak256 hashes`);
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
      expect(JSON.stringify(block), 'Error stringify-ing a block').to.be.equal(strExpected);

      expect(JSON.parse(strExpected), 'Error parsing a block').to.be.deep.equal(block);
    });
  });
});
