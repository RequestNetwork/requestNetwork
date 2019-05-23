import { DataAccess as DataAccessTypes, Storage as StorageTypes } from '@requestnetwork/types';
import Utils from '@requestnetwork/utils';

import Block from './block';
import IntervalTimer from './interval-timer';
import InMemoryTransactionIndex from './transaction-index/in-memory';

// Default interval time for auto synchronization
const DEFAULT_INTERVAL_TIME: number = 10000;

/**
 * Options for the DataAccess initialization
 */
export interface IDataAccessOptions {
  /**
   *  the transaction index, defaults to InMemoryTransactionIndex if not set.
   */
  transactionIndex?: DataAccessTypes.ITransactionIndex;

  /**
   * synchronizationIntervalTime Interval time between each synchronization
   * Defaults to DEFAULT_INTERVAL_TIME.
   */
  synchronizationIntervalTime?: number;
}

/**
 * Implementation of Data-Access layer without encryption
 */
export default class DataAccess implements DataAccessTypes.IDataAccess {
  // Transaction index, that allows storing and retrieving transactions by channel or topic, with time boundaries.
  private transactionIndex: DataAccessTypes.ITransactionIndex;
  // Storage layer
  private storage: StorageTypes.IStorage;

  // The function used to synchronize with the storage should be called periodically
  // This object allows to handle the periodical call of the function
  private synchronizationTimer: IntervalTimer;

  // Timestamp of the last synchronization
  // This the last timestamp we got the data
  private lastSyncedTimeStamp: number;

  /**
   * Constructor DataAccess interface
   *
   * @param IStorage storage storage object
   * @param options
   */
  public constructor(storage: StorageTypes.IStorage, options?: IDataAccessOptions) {
    const defaultOptions: IDataAccessOptions = {
      synchronizationIntervalTime: DEFAULT_INTERVAL_TIME,
      transactionIndex: new InMemoryTransactionIndex(),
    };
    options = {
      ...defaultOptions,
      ...options,
    };
    this.storage = storage;
    this.lastSyncedTimeStamp = 0;
    this.synchronizationTimer = new IntervalTimer(
      (): Promise<void> => this.synchronizeNewDataIds(),
      options.synchronizationIntervalTime!,
    );
    this.transactionIndex = options.transactionIndex!;
  }

  /**
   * Function to initialize the dataId topic with the previous block
   */
  public async initialize(): Promise<void> {
    this.initializeEmpty();

    // initialize storage
    await this.storage.initialize();

    // if transaction index already has data, then sync from the last available timestamp
    const lastSynced = await this.transactionIndex.getLastTransactionTimestamp();
    const now = Utils.getCurrentTimestampInSecond();

    // initialize the dataId topic with the previous block
    const allDataIdsWithMeta = await this.storage.getDataId(
      lastSynced
        ? {
            from: lastSynced,
            to: now,
          }
        : undefined,
    );

    // The last synced timestamp is the current timestamp
    this.lastSyncedTimeStamp = now;

    // check if the data returned by getDataId are correct
    // if yes, the dataIds are indexed with LocationByTopic
    await this.pushLocationsWithTopicsFromDataIds(allDataIdsWithMeta);
  }

  /**
   * Function to persist transaction and topic in storage
   * For now, we create a block for each transaction
   *
   * @param transaction transaction to persist
   * @param channelId string to identify a bunch of transaction
   * @param topics list of string to topic the transaction
   *
   * @returns string dataId where the transaction is stored
   */
  public async persistTransaction(
    transaction: DataAccessTypes.ITransaction,
    channelId: string,
    topics: string[] = [],
  ): Promise<DataAccessTypes.IReturnPersistTransaction> {
    this.checkInitialized();
    // create a block and add the transaction in it
    const updatedBlock = Block.pushTransaction(
      Block.createEmptyBlock(),
      transaction,
      channelId,
      topics,
    );
    // get the topic of the data in storage
    const resultAppend = await this.storage.append(JSON.stringify(updatedBlock));

    // adds this transaction to the index, to enable retrieving it later.
    await this.transactionIndex.addTransaction(
      resultAppend.result.dataId,
      updatedBlock.header,
      resultAppend.meta.timestamp,
    );

    return {
      meta: {
        storageMeta: resultAppend.meta,
        topics,
        transactionStorageLocation: resultAppend.result.dataId,
      },
      result: {},
    };
  }

  /**
   * Function to get a list of transactions indexed by channel id
   * if timestampBoundaries is given, the search will be restrict from timestamp 'from' to the timestamp 'to'.
   * if timestampBoundaries.from is not given, the search will be start from the very start
   * if timestampBoundaries.to is not given, the search will be stop at the current timestamp
   *
   * @param channelId channel id to retrieve the transaction from
   * @param timestampBoundaries timestamp boundaries of the transactions search
   *
   * @returns list of transactions in the channel
   */
  public async getTransactionsByChannelId(
    channelId: string,
    timestampBoundaries?: DataAccessTypes.ITimestampBoundaries,
  ): Promise<DataAccessTypes.IReturnGetTransactions> {
    this.checkInitialized();
    // Gets the list of locationStorage indexed by the channel id that are within the boundaries
    const storageLocationList = await this.transactionIndex.getStorageLocationList(
      channelId,
      timestampBoundaries,
    );
    // Gets the block and meta from the storage location
    const blockWithMetaList = await this.getBlockAndMetaFromStorageLocation(storageLocationList);

    // Get the transactions (and the meta) indexed by channelIds in the blocks found
    const transactionsAndMetaPerBlocks: Array<{
      transactions: DataAccessTypes.IConfirmedTransaction[];
      transactionsStorageLocation: string[];
      storageMeta: string[];
    }> =
      // for all the blocks found
      blockWithMetaList.map(blockAndMeta => {
        // Gets the list of positions of the transaction needed from the block
        const transactionPositions: number[] = Block.getTransactionPositionFromChannelId(
          blockAndMeta.block,
          channelId,
        );

        return this.getTransactionAndMetaFromPosition(
          transactionPositions,
          blockAndMeta.block,
          blockAndMeta.location,
          blockAndMeta.meta,
        );
      });

    // Creates the result by concatenating the transactions and meta of every blocks
    return transactionsAndMetaPerBlocks.reduce(
      (accumulator: DataAccessTypes.IReturnGetTransactions, elem) => ({
        meta: {
          storageMeta: accumulator.meta.storageMeta.concat(elem.storageMeta),
          transactionsStorageLocation: accumulator.meta.transactionsStorageLocation.concat(
            elem.transactionsStorageLocation,
          ),
        },
        result: {
          transactions: accumulator.result.transactions.concat(elem.transactions),
        },
      }),
      // initial value is full of empty arrays
      {
        meta: { storageMeta: [], transactionsStorageLocation: [] },
        result: { transactions: [] },
      },
    );
  }

  /**
   * Function to get a list of channels indexed by topic
   *
   * @param topic topic to retrieve the transaction from
   * @param updatedBetween filter the channels that have received new data within the time boundaries
   *
   * @returns list of channels indexed by topic
   */
  public async getChannelsByTopic(
    topic: string,
    updatedBetween?: DataAccessTypes.ITimestampBoundaries,
  ): Promise<DataAccessTypes.IReturnGetChannelsByTopic> {
    this.checkInitialized();
    const channelIds = await this.transactionIndex.getChannelIdsForTopic(topic, updatedBetween);

    // Gets the transactions per channel id
    const transactionsAndMeta = await Promise.all(
      channelIds.map(channelId =>
        this.getTransactionsByChannelId(channelId).then(transactionsWithMeta => ({
          channelId,
          transactionsWithMeta,
        })),
      ),
    );

    // Gather all the transaction in one object
    return transactionsAndMeta.reduce(
      (finalResult: DataAccessTypes.IReturnGetChannelsByTopic, channelIdAndTransactions: any) => {
        const id = channelIdAndTransactions.channelId;

        // Adds the storage location of the channel's data
        finalResult.meta.transactionsStorageLocation[id] =
          channelIdAndTransactions.transactionsWithMeta.meta.transactionsStorageLocation;

        // Adds the meta of the channel
        finalResult.meta.storageMeta[id] =
          channelIdAndTransactions.transactionsWithMeta.meta.storageMeta;

        // Adds the transaction of the channel
        finalResult.result.transactions[id] =
          channelIdAndTransactions.transactionsWithMeta.result.transactions;

        return finalResult;
      },
      {
        meta: {
          storageMeta: {},
          transactionsStorageLocation: {},
        },
        result: { transactions: {} },
      },
    );
  }

  /**
   * Function to synchronize with the new dataIds on the storage
   */
  public async synchronizeNewDataIds(): Promise<void> {
    this.checkInitialized();
    const synchronizationFrom = this.lastSyncedTimeStamp;
    const synchronizationTo = Utils.getCurrentTimestampInSecond();

    // Read new dataIds from storage
    const newDataIdsWithMeta = await this.storage.getDataId({
      from: synchronizationFrom,
      to: synchronizationTo,
    });

    // check if the data returned by getNewDataId are correct
    // if yes, the dataIds are indexed with LocationByTopic
    await this.pushLocationsWithTopicsFromDataIds(newDataIdsWithMeta);

    // update the last synced Timestamp
    this.lastSyncedTimeStamp = synchronizationTo;
  }

  /**
   * Start to synchronize with the storage automatically
   * Once called, synchronizeNewDataId function is called periodically
   */
  public startAutoSynchronization(): void {
    this.checkInitialized();
    this.synchronizationTimer.start();
  }

  /**
   * Stop to synchronize with the storage automatically
   */
  public stopAutoSynchronization(): void {
    this.synchronizationTimer.stop();
  }

  /**
   * Creates an empty TransactionIndex
   *
   * @protected
   * @memberof DataAccess
   */
  protected initializeEmpty(): void {
    if (this.transactionIndex.isInitialized()) {
      throw new Error('already initialized');
    }
    this.transactionIndex.initializeEmpty();
  }

  /**
   * Check the format of the dataIds, extract the topics from it and push location indexed with the topics
   *
   * @private
   * @param dataIdsWithMeta dataIds from getDataId and getNewDataId from storage functions
   * @param locationByTopic LocationByTopic object to push location
   */
  private async pushLocationsWithTopicsFromDataIds(
    dataIdsWithMeta: StorageTypes.IGetDataIdReturn | StorageTypes.IGetNewDataIdReturn,
  ): Promise<void[]> {
    this.checkInitialized();
    if (!dataIdsWithMeta.result) {
      throw Error(`data from storage do not follow the standard, result is missing`);
    }

    const dataIds = dataIdsWithMeta.result.dataIds;
    // Get all the results
    const resultReadMany = await this.storage.readMany(dataIds);

    if (!resultReadMany) {
      throw Error(`data from storage do not follow the standard, result is missing`);
    }
    if (resultReadMany.length !== dataIds.length) {
      throw new Error(
        `Wrong amount of data read from storage. Expected ${dataIds.length}, got ${
          resultReadMany.length
        }.`,
      );
    }

    return Promise.all(
      resultReadMany.map((resultRead, index) => {
        if (!resultRead.result) {
          throw Error(`data from storage do not follow the standard, result is missing`);
        }

        let block;
        try {
          block = JSON.parse(resultRead.result.content);
        } catch (e) {
          throw Error(`can't parse content of the dataId: ${e}`);
        }
        if (!block.header || !block.header.topics) {
          throw Error(
            `data from storage do not follow the standard, storage location: "${dataIds[index]}"`,
          );
        }

        // adds this transaction to the index, to enable retrieving it later.
        return this.transactionIndex.addTransaction(
          dataIds[index],
          block.header,
          resultRead.meta.timestamp,
        );
      }),
    );
  }

  /**
   * Gets the blocks and their metadata from an array of storage location
   *
   * @param storageLocationList array of storage location
   * @returns the blocks and their metadata
   */
  private async getBlockAndMetaFromStorageLocation(
    storageLocationList: string[],
  ): Promise<
    Array<{ block: DataAccessTypes.IBlock; meta: StorageTypes.IMetaOneData; location: string }>
  > {
    // Gets blocks indexed by topic
    return Promise.all(
      storageLocationList.map(async location => {
        const resultRead = await this.storage.read(location);

        return {
          block: JSON.parse(resultRead.result.content),
          location,
          meta: resultRead.meta,
        };
      }),
    );
  }

  /**
   * Gets the transactions and their metadata from a block and an array of transaction positions
   *
   * @param transactionPositions transaction positions to retrieve
   * @param block the block
   * @param location location of the block
   * @param meta metadata of the block
   * @returns the transactions and their metadata
   */
  private getTransactionAndMetaFromPosition(
    transactionPositions: number[],
    block: DataAccessTypes.IBlock,
    location: string,
    meta: StorageTypes.IMetaOneData,
  ): {
    transactions: DataAccessTypes.IConfirmedTransaction[];
    transactionsStorageLocation: string[];
    storageMeta: string[];
  } {
    // Gets the transaction from the positions
    const transactions: DataAccessTypes.IConfirmedTransaction[] =
      // first remove de duplicates
      Utils.unique(transactionPositions).uniqueItems.map(
        // Get the transaction from their position and add the timestamp
        (position: number) => ({
          timestamp: meta.timestamp,
          transaction: block.transactions[position],
        }),
      );

    // Gets the list of storage location of the transactions found
    const transactionsStorageLocation = Array(transactions.length).fill(location);

    // Gets the list of storage meta of the transactions found
    const storageMeta = Array(transactions.length).fill(meta);

    return { transactions, transactionsStorageLocation, storageMeta };
  }

  /**
   * Throws an error if the data access isn't initialized
   */
  private checkInitialized(): void {
    if (!this.transactionIndex.isInitialized()) {
      throw new Error('DataAccess must be initialized');
    }
  }
}
