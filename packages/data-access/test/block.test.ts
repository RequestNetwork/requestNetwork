import { expect } from 'chai';
import 'mocha';

import { DataAccessTypes } from '@requestnetwork/types';
import Utils from '@requestnetwork/utils';
import RequestDataAccessBlock from '../src/block';

const CURRENT_VERSION = '0.1.0';
const transactionDataMock1String = JSON.stringify({
  attribut1: 'plop',
  attribut2: 'value',
});
const transactionHash1 = Utils.crypto.normalizeKeccak256Hash(transactionDataMock1String);

const transactionDataMock2String = JSON.stringify({
  attribut1: 'foo',
  attribut2: 'bar',
});
const transactionHash2 = Utils.crypto.normalizeKeccak256Hash(transactionDataMock2String);

const transactionMock: DataAccessTypes.ITransaction = {
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
          [arbitraryId1]: [arbitraryTopic1, arbitraryTopic2, transactionHash1],
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
        topics: {
          [arbitraryId1]: [transactionHash1],
        },
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
          [arbitraryId1]: [transactionHash1],
          [arbitraryId2]: [arbitraryTopic1, arbitraryTopic2, transactionHash2],
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
        topics: {
          [arbitraryId1]: [transactionHash1],
        },
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
        topics: {
          [arbitraryId1]: [transactionHash1],
        },
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
          [arbitraryId1]: [transactionHash1],
          [arbitraryId2]: [transactionHash2],
        },
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
          [arbitraryId1]: [arbitraryTopic1, arbitraryTopic2, transactionHash1],
          [arbitraryId2]: [arbitraryTopic2, transactionHash2],
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
        [arbitraryId1]: [arbitraryTopic1, arbitraryTopic2, transactionHash1],
        [arbitraryId2]: [arbitraryTopic2, transactionHash2],
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
      expect(() => RequestDataAccessBlock.parseBlock(blockNotJson)).to.throw();

      const blockWithoutHeader = {
        transactions: [{ data: '' }],
      };
      expect(() =>
        RequestDataAccessBlock.parseBlock(JSON.stringify(blockWithoutHeader)),
      ).to.throw();

      const blockWithoutChannelIds = {
        header: { topics: {}, version: '0.1.0' },
        transactions: [{ data: '' }],
      };
      expect(() =>
        RequestDataAccessBlock.parseBlock(JSON.stringify(blockWithoutChannelIds)),
      ).to.throw();

      const blockWithoutTopics = {
        header: { channelIds: {}, version: '0.1.0' },
        transactions: [{ data: '' }],
      };
      expect(() =>
        RequestDataAccessBlock.parseBlock(JSON.stringify(blockWithoutTopics)),
      ).to.throw();

      const blockWithoutVersion = {
        header: { channelIds: {}, topics: {} },
        transactions: [{ data: '' }],
      };
      expect(() =>
        RequestDataAccessBlock.parseBlock(JSON.stringify(blockWithoutVersion)),
      ).to.throw();

      const blockWithoutTransactionData = {
        header: { channelIds: {}, topics: {}, version: '0.1.0' },
        transactions: [{}],
      };
      expect(() =>
        RequestDataAccessBlock.parseBlock(JSON.stringify(blockWithoutTransactionData)),
      ).to.throw();
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
            [arbitraryId1]: [
              '0xaaaaaa',
              '0xccccccccccc',
              '0xc23dc7c66c4b91a3a53f9a052ab8c359fd133c8ddf976aab57f296ffd9d4a2ca',
            ],
            [arbitraryId2]: [
              '0xccccccccccc',
              '0x60d9be697d09d3d93d5e812a42f72a60411b4d364726bf89fa811d5330d00bd1',
            ],
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
