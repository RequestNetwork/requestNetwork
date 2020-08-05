import MultiFormat from '@requestnetwork/multi-format';
import { DataAccessTypes } from '@requestnetwork/types';
import Utils from '@requestnetwork/utils';

/**
 * Module to manage a block in the data access-layer
 * a block is a sorted list of transactions with topics
 */
export default {
  createEmptyBlock,
  getAllChannelIds,
  getAllTopics,
  getAllTransactions,
  getTransactionFromPosition,
  getTransactionPositionFromChannelId,
  getTransactionPositionsByChannelIds,
  getTransactionsByPositions,
  parseBlock,
  pushTransaction,
};

/**
 * Function to create an empty block
 *
 * @returns IBlock an empty block
 */
function createEmptyBlock(): DataAccessTypes.IBlock {
  return {
    header: {
      channelIds: {},
      topics: {},
      version: '0.1.0',
    },
    transactions: [],
  };
}

/**
 * Parses a string to a block checking if the standard is followed
 *
 * @param data the data to parse
 * @returns the block or throw en exception if the standard is not followed
 */
function parseBlock(data: string): DataAccessTypes.IBlock {
  let maybeBlock;
  try {
    maybeBlock = JSON.parse(data);
  } catch (e) {
    throw new Error(`Impossible to JSON parse the data: "${e}"`);
  }
  if (!maybeBlock.header || !maybeBlock.transactions) {
    throw new Error(`Data do not follow the block standard`);
  }
  if (!maybeBlock.header.topics || !maybeBlock.header.channelIds || !maybeBlock.header.version) {
    throw new Error(`Header do not follow the block standard`);
  }
  if (maybeBlock.header.version !== '0.1.0') {
    throw new Error(`Version not supported`);
  }

  // check the transactions format
  if (!maybeBlock.transactions.every((tx: any) => tx.data || tx.encryptedData)) {
    throw new Error(`Transactions do not follow the block standard`);
  }
  // check if channelIds are well formatted
  // check that all the channel ids are hashes
  if (
    Object.keys(maybeBlock.header.channelIds).some(
      (channelId: string) => !MultiFormat.hashFormat.isDeserializableString(channelId),
    )
  ) {
    throw new Error(`Channel ids in header.channelIds must be formatted keccak256 hashes`);
  }

  // check if channel ids refer to actual transactions in the block
  const transactionCount = maybeBlock.transactions.length;
  if (
    Object.values(maybeBlock.header.channelIds).some((listOfTransactionPosition: any) =>
      listOfTransactionPosition.some(
        (position: number) => position < 0 || position >= transactionCount,
      ),
    )
  ) {
    throw new Error(`transactions in channel ids must refer to transaction in the blocks`);
  }

  // check if topics are well formatted
  // check that all the channel ids are hashes
  if (
    Object.keys(maybeBlock.header.topics).some(
      (channelId: string) => !MultiFormat.hashFormat.isDeserializableString(channelId),
    )
  ) {
    throw new Error(`Channel ids in header.topics must be formatted keccak256 hashes`);
  }
  // check if topics are hashes
  if (
    Object.values(maybeBlock.header.topics).some((listOfTopics: any) =>
      listOfTopics.some((topic: string) => !MultiFormat.hashFormat.isDeserializableString(topic)),
    )
  ) {
    throw new Error(`topics in header.topics must be formatted keccak256 hashes`);
  }

  return maybeBlock as DataAccessTypes.IBlock;
}

/**
 * Function to add a transaction and topics in the block
 *
 * @param block previous state will not be modified
 * @param transaction transaction to push
 * @param channelId id of the channel to add the transaction in
 * @param topics strings to topic the channel
 *
 * @returns the new state
 */
function pushTransaction(
  block: DataAccessTypes.IBlock,
  transaction: DataAccessTypes.ITransaction,
  channelId: string,
  topics: string[] = [],
): DataAccessTypes.IBlock {
  if (transaction.data === undefined && !transaction.encryptedData) {
    throw new Error('The transaction is missing the data property or encryptedData property');
  }
  // we don't want to modify the original block state
  const copiedBlock: DataAccessTypes.IBlock = Utils.deepCopy(block);

  const newTransactionPosition = copiedBlock.transactions.length;
  copiedBlock.transactions.push(transaction);

  // index the transaction with the channel id
  copiedBlock.header.channelIds[channelId] = (
    copiedBlock.header.channelIds[channelId] || []
  ).concat([newTransactionPosition]);

  // add topics in the header
  for (const topic of topics) {
    copiedBlock.header.topics[channelId] = (copiedBlock.header.topics[channelId] || []).concat([
      topic,
    ]);
  }

  return copiedBlock;
}

/**
 * Returns a transaction from its position
 *
 * @param block current block state
 * @param position position of the transaction in the block
 *
 * @returns the transaction
 */
function getTransactionFromPosition(
  block: DataAccessTypes.IBlock,
  position: number,
): DataAccessTypes.ITransaction {
  return block.transactions[position];
}

/**
 * Returns several transactions from their positions
 *
 * @param block current block state
 * @param positions list of positions of the transactions
 *
 * @returns the transactions
 */
function getTransactionsByPositions(
  block: DataAccessTypes.IBlock,
  positions: number[],
): DataAccessTypes.ITransaction[] {
  // remove duplicates and sort
  const sortedPositions = Array.from(new Set(positions)).sort();

  return sortedPositions
    .map(position => block.transactions[position])
    .filter(position => position !== undefined);
}

/**
 * Returns all transactions of a block
 *
 * @param block current block state
 *
 * @returns all the transactions with topics
 */
function getAllTransactions(block: DataAccessTypes.IBlock): DataAccessTypes.ITransaction[] {
  return block.transactions;
}

/**
 * Returns a list of the positions of the transactions with given channel id
 *
 * @param block current block state
 * @param channelId the channel id
 *
 * @returns list of transaction positions
 */
function getTransactionPositionFromChannelId(
  block: DataAccessTypes.IBlock,
  channelId: string,
): number[] {
  return block.header.channelIds[channelId] || [];
}

/**
 * Returns a list of transactions position from a list of channel ids
 *
 * @param block current block state
 * @param ids the channel ids
 *
 * @returns list of transaction positions
 */
function getTransactionPositionsByChannelIds(
  block: DataAccessTypes.IBlock,
  channelIds: string[],
): number[] {
  const result: number[] = channelIds
    .map(id => block.header.channelIds[id])
    .filter(value => value !== undefined)
    .reduce((accumulator, current) => accumulator.concat(current), []);

  // remove duplicates and sort
  return Array.from(new Set(result)).sort();
}

/**
 * Returns all the topics of the block
 *
 * @param block current block state
 *
 * @returns all the topics
 */
function getAllTopics(block: DataAccessTypes.IBlock): DataAccessTypes.ITopics {
  return block.header.topics;
}

/**
 * Returns all the channel ids of the block
 *
 * @param block current block state
 *
 * @returns all the channel ids
 */
function getAllChannelIds(block: DataAccessTypes.IBlock): DataAccessTypes.IChannelIds {
  return block.header.channelIds;
}
