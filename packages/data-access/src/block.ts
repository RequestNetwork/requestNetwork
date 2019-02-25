import { DataAccess as Types } from '@requestnetwork/types';
import Utils from '@requestnetwork/utils';

/**
 * Module to manage a block in the data access-layer
 * a block is a sorted list of transactions with topics
 */
export default {
  createEmptyBlock,
  getAllTopics,
  getAllTransactions,
  getTransactionFromPosition,
  getTransactionPositionFromTopic,
  getTransactionPositionsByTopics,
  getTransactionsByPositions,
  pushTransaction,
};

/**
 * Function to create an empty block
 *
 * @returns IBlock an empty block
 */
function createEmptyBlock(): Types.IBlock {
  return {
    header: {
      topics: {},
      version: '0.1.0',
    },
    transactions: [],
  };
}

/**
 * Function to add a transaction and topics in the block
 *
 * @param IBlock block previous state will not be modified
 * @param ITransaction transaction transaction to push
 * @param string[] topics strings to topic the transaction
 *
 * @returns IBlock the new state
 */
function pushTransaction(
  block: Types.IBlock,
  transaction: Types.ITransaction,
  topics: string[] = [],
): Types.IBlock {
  if (transaction.data === undefined) {
    throw new Error('The transaction is missing the data property');
  }
  // we don't want to modify the original block state
  const copiedBlock: Types.IBlock = Utils.deepCopy(block);

  const newTransactionPosition = copiedBlock.transactions.length;
  copiedBlock.transactions.push(transaction);

  const txHash = Utils.crypto.normalizeKeccak256Hash(transaction.data);

  // concat topic given and the default topic (hash)
  topics.push(txHash);

  // add topics in the header
  for (const topic of topics) {
    copiedBlock.header.topics[topic] = (copiedBlock.header.topics[topic] || []).concat([
      newTransactionPosition,
    ]);
  }

  return copiedBlock;
}

/**
 * Returns a transaction from its position
 *
 * @param IBlock block current block state
 * @param number position position of the transaction
 *
 * @returns ITransaction the transaction
 */
function getTransactionFromPosition(block: Types.IBlock, position: number): Types.ITransaction {
  return block.transactions[position];
}

/**
 * Returns several transactions from their positions
 *
 * @param IBlock block current block state
 * @param number[] positions list of positions of the transactions
 *
 * @returns ITransaction[] the transactions
 */
function getTransactionsByPositions(
  block: Types.IBlock,
  positions: number[],
): Types.ITransaction[] {
  // remove duplicates and sort
  const sortedPositions = Array.from(new Set(positions)).sort();

  return sortedPositions
    .map(position => block.transactions[position])
    .filter(position => position !== undefined);
}

/**
 * Returns all transactions of a block
 *
 * @param IBlock block current block state
 *
 * @returns ITransaction[] all the transactions with topics
 */
function getAllTransactions(block: Types.IBlock): Types.ITransaction[] {
  return block.transactions;
}

/**
 * Returns a list of the positions of the transactions with given topics
 *
 * @param IBlock block current block state
 * @param string topic the topic value
 *
 * @returns number[] list of transaction position
 */
function getTransactionPositionFromTopic(block: Types.IBlock, topic: string): number[] {
  return block.header.topics[topic] || [];
}

/**
 * Returns a list of transactions position from a list of topics
 *
 * @param IBlock block current block state
 * @param string[] topics the topics value
 *
 * @returns number[] list of transaction positions
 */
function getTransactionPositionsByTopics(block: Types.IBlock, topics: string[]): number[] {
  const result: number[] = topics
    .map(i => block.header.topics[i])
    .filter(value => value !== undefined)
    .reduce((accumulator, current) => accumulator.concat(current), []);

  // remove duplicates and sort
  return Array.from(new Set(result)).sort();
}

/**
 * Returns all the topics of the block
 *
 * @param IBlock block current block state
 *
 * @returns ITopics all the topics
 */
function getAllTopics(block: Types.IBlock): Types.ITopics {
  return block.header.topics;
}
