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
 * @returns IRequestDataAccessBlock an empty block
 */
function createEmptyBlock(): Types.IRequestDataAccessBlock {
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
 * @param IRequestDataAccessBlock block previous state will not be modified
 * @param IRequestDataAccessTransaction transaction transaction to push
 * @param string[] topics strings to topic the transaction
 *
 * @returns IRequestDataAccessBlock the new state
 */
function pushTransaction(
  block: Types.IRequestDataAccessBlock,
  transaction: Types.IRequestDataAccessTransaction,
  topics: string[] = [],
): Types.IRequestDataAccessBlock {
  // we don't want to modify the original block state
  const copiedBlock: Types.IRequestDataAccessBlock = Utils.deepCopy(block);

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
 * @param IRequestDataAccessBlock block current block state
 * @param number position position of the transaction
 *
 * @returns IRequestDataAccessTransaction the transaction
 */
function getTransactionFromPosition(
  block: Types.IRequestDataAccessBlock,
  position: number,
): Types.IRequestDataAccessTransaction {
  return block.transactions[position];
}

/**
 * Returns several transactions from their positions
 *
 * @param IRequestDataAccessBlock block current block state
 * @param number[] positions list of positions of the transactions
 *
 * @returns IRequestDataAccessTransaction[] the transactions
 */
function getTransactionsByPositions(
  block: Types.IRequestDataAccessBlock,
  positions: number[],
): Types.IRequestDataAccessTransaction[] {
  // remove duplicates and sort
  const sortedPositions = Array.from(new Set(positions)).sort();

  return sortedPositions
    .map(position => block.transactions[position])
    .filter(position => position !== undefined);
}

/**
 * Returns all transactions of a block
 *
 * @param IRequestDataAccessBlock block current block state
 *
 * @returns IRequestDataAccessTransaction[] all the transactions with topics
 */
function getAllTransactions(
  block: Types.IRequestDataAccessBlock,
): Types.IRequestDataAccessTransaction[] {
  return block.transactions;
}

/**
 * Returns a list of the positions of the transactions with given topics
 *
 * @param IRequestDataAccessBlock block current block state
 * @param string topic the topic value
 *
 * @returns number[] list of transaction position
 */
function getTransactionPositionFromTopic(
  block: Types.IRequestDataAccessBlock,
  topic: string,
): number[] {
  return block.header.topics[topic] || [];
}

/**
 * Returns a list of transactions position from a list of topics
 *
 * @param IRequestDataAccessBlock block current block state
 * @param string[] topics the topics value
 *
 * @returns number[] list of transaction positions
 */
function getTransactionPositionsByTopics(
  block: Types.IRequestDataAccessBlock,
  topics: string[],
): number[] {
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
 * @param IRequestDataAccessBlock block current block state
 *
 * @returns IRequestDataAccessTopics all the topics
 */
function getAllTopics(block: Types.IRequestDataAccessBlock): Types.IRequestDataAccessTopics {
  return block.header.topics;
}
