import { expect } from 'chai';
import 'mocha';

import { DataAccess as Types, Signature as SignatureTypes } from '@requestnetwork/types';
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
const signatureMock = {
  method: SignatureTypes.REQUEST_SIGNATURE_METHOD.ECDSA,
  value: '0x12345',
};
const transactionMock: Types.IRequestDataAccessTransaction = {
  data: transactionDataMock1String,
  signature: signatureMock,
};
const transactionMock2: Types.IRequestDataAccessTransaction = {
  data: transactionDataMock2String,
  signature: signatureMock,
};

const arbitraryTopic1 = 'Oxaaaaaa';
const arbitraryTopic2 = 'Oxccccccccccc';

const emptyblock = RequestDataAccessBlock.createEmptyBlock();
const blockWith1tx = RequestDataAccessBlock.pushTransaction(emptyblock, transactionMock, [
  arbitraryTopic1,
  arbitraryTopic2,
]);
const blockWith2tx = RequestDataAccessBlock.pushTransaction(blockWith1tx, transactionMock2, [
  arbitraryTopic2,
]);

/* tslint:disable:no-unused-expression */
describe('block', () => {
  describe('createEmptyBlock', () => {
    it('can create an empty block', () => {
      const emptyblock1 = RequestDataAccessBlock.createEmptyBlock();
      expect(emptyblock1.header, 'header is wrong').to.be.deep.equal({
        topics: {},
        version: CURRENT_VERSION,
      });
      expect(emptyblock1.transactions, 'transactions are wrong').to.be.deep.equal([]);
    });
  });

  describe('pushTransaction', () => {
    it('can pushTransaction with topics an empty block', () => {
      const newBlock = RequestDataAccessBlock.pushTransaction(emptyblock, transactionMock, [
        arbitraryTopic1,
        arbitraryTopic2,
      ]);
      // empty block mush remain empty
      expect(emptyblock.header, 'previous header must not change').to.be.deep.equal({
        topics: {},
        version: CURRENT_VERSION,
      });
      expect(emptyblock.transactions, 'previous transactions must not change').to.be.deep.equal([]);

      // new block
      const topicsExpected: any = {};
      topicsExpected[transactionHash1] = [0];
      topicsExpected[arbitraryTopic1] = [0];
      topicsExpected[arbitraryTopic2] = [0];

      expect(newBlock.header, 'header is wrong').to.be.deep.equal({
        topics: topicsExpected,
        version: CURRENT_VERSION,
      });
      expect(newBlock.transactions, 'transactions are wrong').to.be.deep.equal([transactionMock]);
    });
    it('can pushTransaction with topics a NOT empty block', () => {
      const previousBlock = RequestDataAccessBlock.pushTransaction(emptyblock, transactionMock);

      const newBlock = RequestDataAccessBlock.pushTransaction(previousBlock, transactionMock2, [
        arbitraryTopic1,
        arbitraryTopic2,
      ]);
      // empty block mush remain empty

      const previousTopicExpected: any = {};
      previousTopicExpected[transactionHash1] = [0];

      expect(previousBlock.header, 'previous header must not change').to.be.deep.equal({
        topics: previousTopicExpected,
        version: CURRENT_VERSION,
      });
      expect(previousBlock.transactions, 'transactions are wrong').to.be.deep.equal([
        transactionMock,
      ]);

      // new block
      const topicsExpected: any = {};
      topicsExpected[transactionHash1] = [0];
      topicsExpected[transactionHash2] = [1];
      topicsExpected[arbitraryTopic1] = [1];
      topicsExpected[arbitraryTopic2] = [1];

      expect(newBlock.header, 'header is wrong').to.be.deep.equal({
        topics: topicsExpected,
        version: CURRENT_VERSION,
      });
      expect(newBlock.transactions, 'transactions are wrong').to.be.deep.equal([
        transactionMock,
        transactionMock2,
      ]);
    });
    it('can pushTransaction without topics on an empty block', () => {
      const newBlock = RequestDataAccessBlock.pushTransaction(emptyblock, transactionMock);
      // empty block mush remain empty
      expect(emptyblock.header, 'previous header must not change').to.be.deep.equal({
        topics: {},
        version: CURRENT_VERSION,
      });
      expect(emptyblock.transactions, 'previous transactions must not change').to.be.deep.equal([]);

      // new block
      const topicsExpected: any = {};
      topicsExpected[transactionHash1] = [0];

      expect(newBlock.header, 'header is wrong').to.be.deep.equal({
        topics: topicsExpected,
        version: CURRENT_VERSION,
      });
      expect(newBlock.transactions, 'transactions are wrong').to.be.deep.equal([transactionMock]);
    });
    it('can pushTransaction without topics on a NOT empty block', () => {
      const previousBlock = RequestDataAccessBlock.pushTransaction(emptyblock, transactionMock);
      const newBlock = RequestDataAccessBlock.pushTransaction(previousBlock, transactionMock2);
      // empty block mush remain empty

      const previousTopicExpected: any = {};
      previousTopicExpected[transactionHash1] = [0];

      expect(previousBlock.header, 'previous header must not change').to.be.deep.equal({
        topics: previousTopicExpected,
        version: CURRENT_VERSION,
      });
      expect(previousBlock.transactions, 'transactions are wrong').to.be.deep.equal([
        transactionMock,
      ]);

      // new block
      const topicsExpected: any = {};
      topicsExpected[transactionHash1] = [0];
      topicsExpected[transactionHash2] = [1];

      expect(newBlock.header, 'header is wrong').to.be.deep.equal({
        topics: topicsExpected,
        version: CURRENT_VERSION,
      });
      expect(newBlock.transactions, 'transactions are wrong').to.be.deep.equal([
        transactionMock,
        transactionMock2,
      ]);
    });
    it('can pushTransaction with topics with topics already existing', () => {
      const newBlock = RequestDataAccessBlock.pushTransaction(blockWith1tx, transactionMock2, [
        arbitraryTopic2,
      ]);
      // empty block mush remain empty

      const previousTopicExpected: any = {};
      previousTopicExpected[transactionHash1] = [0];
      previousTopicExpected[arbitraryTopic1] = [0];
      previousTopicExpected[arbitraryTopic2] = [0];

      expect(blockWith1tx.header, 'previous header must not change').to.be.deep.equal({
        topics: previousTopicExpected,
        version: CURRENT_VERSION,
      });
      expect(blockWith1tx.transactions, 'transactions are wrong').to.be.deep.equal([
        transactionMock,
      ]);

      // new block
      const topicsExpected: any = {};
      topicsExpected[transactionHash1] = [0];
      topicsExpected[transactionHash2] = [1];
      topicsExpected[arbitraryTopic1] = [0];
      topicsExpected[arbitraryTopic2] = [0, 1];

      expect(newBlock.header, 'header is wrong').to.be.deep.equal({
        topics: topicsExpected,
        version: CURRENT_VERSION,
      });
      expect(newBlock.transactions, 'transactions are wrong').to.be.deep.equal([
        transactionMock,
        transactionMock2,
      ]);
    });
  });

  describe('getAllTransactions', () => {
    it('can getAllTransactions on empty block', () => {
      const allTxs = RequestDataAccessBlock.getAllTransactions(emptyblock);
      expect(allTxs, 'transactions must be empty').to.be.deep.equal([]);
    });
    it('can getAllTransactions on NOT empty block', () => {
      let newBlock = RequestDataAccessBlock.pushTransaction(emptyblock, transactionMock, [
        arbitraryTopic1,
        arbitraryTopic2,
      ]);
      newBlock = RequestDataAccessBlock.pushTransaction(newBlock, transactionMock2);
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
      const topicsExpected: any = {};
      topicsExpected[transactionHash1] = [0];
      topicsExpected[transactionHash2] = [1];
      topicsExpected[arbitraryTopic1] = [0];
      topicsExpected[arbitraryTopic2] = [0, 1];

      const allTopices = RequestDataAccessBlock.getAllTopics(blockWith2tx);
      expect(allTopices, 'transactions must be empty').to.be.deep.equal(topicsExpected);
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

  describe('getTransactionPositionFromTopic', () => {
    it('can getTransactionPositionFromTopic on an empty block', () => {
      const txTopic = RequestDataAccessBlock.getTransactionPositionFromTopic(
        emptyblock,
        arbitraryTopic1,
      );
      expect(txTopic, 'txTopic is wrong').to.be.deep.equal([]);
    });
    it('can getTransactionPositionFromTopic with topics existing', () => {
      const txTopic = RequestDataAccessBlock.getTransactionPositionFromTopic(
        blockWith1tx,
        arbitraryTopic1,
      );
      expect(txTopic, 'txTopic is wrong').to.be.deep.equal([0]);
    });
    it('can getTransactionPositionFromTopic with topics used twice ', () => {
      const txTopic = RequestDataAccessBlock.getTransactionPositionFromTopic(
        blockWith2tx,
        arbitraryTopic2,
      );
      expect(txTopic, 'txTopic is wrong').to.be.deep.equal([0, 1]);
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

  describe('getTransactionPositionsByTopics', () => {
    it('can getTransactionPositionsByTopics on an empty block', () => {
      const txs = RequestDataAccessBlock.getTransactionPositionsByTopics(emptyblock, [
        transactionHash1,
        transactionHash2,
      ]);
      expect(txs, 'txs must be empty').to.be.deep.equal([]);
    });
    it('can getTransactionPositionsByTopics on missing transaction', () => {
      const txs = RequestDataAccessBlock.getTransactionPositionsByTopics(blockWith1tx, [
        transactionHash1,
        transactionHash2,
      ]);
      expect(txs, 'txs is wrong').to.be.deep.equal([0]);
    });
    it('can getTransactionPositionsByTopics on more than one transaction', () => {
      const txs = RequestDataAccessBlock.getTransactionPositionsByTopics(blockWith2tx, [
        transactionHash1,
        transactionHash2,
      ]);
      expect(txs, 'txs is wrong').to.be.deep.equal([0, 1]);
    });
    it('can getTransactionPositionsByTopics on more than one transaction with array not sorted', () => {
      const txs = RequestDataAccessBlock.getTransactionPositionsByTopics(blockWith2tx, [
        transactionHash2,
        transactionHash1,
      ]);
      expect(txs, 'txs is wrong').to.be.deep.equal([0, 1]);
    });
    it('can getTransactionPositionsByTopics on more than one transaction with array duplication', () => {
      const txs = RequestDataAccessBlock.getTransactionPositionsByTopics(blockWith2tx, [
        transactionHash2,
        transactionHash1,
        transactionHash2,
        transactionHash2,
        transactionHash1,
        transactionHash1,
        transactionHash1,
      ]);
      expect(txs, 'txs is wrong').to.be.deep.equal([0, 1]);
    });
    it('can getTransactionPositionsByTopics with topics use twice', () => {
      const txs = RequestDataAccessBlock.getTransactionPositionsByTopics(blockWith2tx, [
        arbitraryTopic2,
      ]);
      expect(txs, 'txs is wrong').to.be.deep.equal([0, 1]);
    });
    it('can getTransactionPositionsByTopics with topics use twice and duplication', () => {
      const txs = RequestDataAccessBlock.getTransactionPositionsByTopics(blockWith2tx, [
        arbitraryTopic2,
        transactionHash2,
        transactionHash1,
        arbitraryTopic1,
      ]);
      expect(txs, 'txs is wrong').to.be.deep.equal([0, 1]);
    });
  });

  describe('can use JSON', () => {
    it('can use JSON.stringify and JSON.parse', () => {
      const block = RequestDataAccessBlock.pushTransaction(blockWith1tx, transactionMock2, [
        arbitraryTopic2,
      ]);
      /* tslint:disable:object-literal-sort-keys  */
      /* tslint:disable:object-literal-key-quotes  */
      const strExpected = JSON.stringify({
        header: {
          topics: {
            Oxaaaaaa: [0],
            Oxccccccccccc: [0, 1],
            '0xc23dc7c66c4b91a3a53f9a052ab8c359fd133c8ddf976aab57f296ffd9d4a2ca': [0],
            '0x60d9be697d09d3d93d5e812a42f72a60411b4d364726bf89fa811d5330d00bd1': [1],
          },
          version: '0.1.0',
        },
        transactions: [
          {
            data: '{"attribut1":"plop","attribut2":"value"}',
            signature: { method: 'ecdsa', value: '0x12345' },
          },
          {
            data: '{"attribut1":"foo","attribut2":"bar"}',
            signature: { method: 'ecdsa', value: '0x12345' },
          },
        ],
      });
      expect(JSON.stringify(block), 'Error stringify-ing a block').to.be.equal(strExpected);

      expect(JSON.parse(strExpected), 'Error parsing a block').to.be.deep.equal(block);
    });
  });
});
