import Utils from '@requestnetwork/utils';
import * as Types from './types';

/**
 * Module to manage a block in the data access-layer
 * a block is a sorted list of transactions with indexes
 */
export default {
  createEmptyBlock,
  getAllIndex,
  getAllTransactions,
  getIndexes,
  getTransactionFromPosition,
  getTransactionPositionByIndex,
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
      index: {},
      version: '0.1.0',
    },
    transactions: [],
  };
}

/**
 * Function to add a transaction and indexes in the block
 *
 * @param IRequestDataAccessBlock block previous state will not be modified
 * @param IRequestDataAccessTransaction transaction transaction to push
 * @param string[] indexes strings to index the transaction
 *
 * @returns IRequestDataAccessBlock the new state
 */
function pushTransaction(
  block: Types.IRequestDataAccessBlock,
  transaction: Types.IRequestDataAccessTransaction,
  indexes: string[] = [],
): Types.IRequestDataAccessBlock {
  // we don't want to modify the original block state
  const copiedBlock: Types.IRequestDataAccessBlock = Utils.deepCopy(block);

  const newtransactionPosition = copiedBlock.transactions.length;
  copiedBlock.transactions.push(transaction);

  const txHash = Utils.crypto.normalizeKeccak256Hash(transaction.data);

  // concat index given and the default index (hash)
  indexes.push(txHash);

  // add index in the header
  for (const index of indexes) {
    copiedBlock.header.index[index] = (
      copiedBlock.header.index[index] || []
    ).concat([newtransactionPosition]);
  }

  return copiedBlock;
}

/**
 * Function to get a transaction from its position
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
 * Function to get several transactions from their positions
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
 * Function to get all transactions of the block
 *
 * @param IRequestDataAccessBlock block current block state
 *
 * @returns IRequestDataAccessTransaction[] all the transactions indexed by hashes
 */
function getAllTransactions(
  block: Types.IRequestDataAccessBlock,
): Types.IRequestDataAccessTransaction[] {
  return block.transactions;
}

/**
 * Function to get a list of the positions of the transactions indexed by a specific index
 *
 * @param IRequestDataAccessBlock block current block state
 * @param string index the indexer value
 *
 * @returns number[] list of transaction position
 */
function getTransactionPositionByIndex(
  block: Types.IRequestDataAccessBlock,
  index: string,
): number[] {
  return block.header.index[index] || [];
}

/**
 * Function to get a list of transactions position from a list of indexes
 *
 * @param IRequestDataAccessBlock block current block state
 * @param string[] indexes the indexers value
 *
 * @returns number[] list of transaction positions
 */
function getIndexes(
  block: Types.IRequestDataAccessBlock,
  indexes: string[],
): number[] {
  const result: number[] = indexes
    .map(i => block.header.index[i])
    .filter(value => value !== undefined)
    .reduce((accumulator, current) => accumulator.concat(current), []);

  // remove duplicates and sort
  return Array.from(new Set(result)).sort();
}

/**
 * Function to get all the indexes of the block
 *
 * @param IRequestDataAccessBlock block current block state
 *
 * @returns IRequestDataAccessIndex all the index
 */
function getAllIndex(
  block: Types.IRequestDataAccessBlock,
): Types.IRequestDataAccessIndex {
  return block.header.index;
}
