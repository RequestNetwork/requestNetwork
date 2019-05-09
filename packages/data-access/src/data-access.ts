import { DataAccess as DataAccessTypes, Storage as StorageTypes } from '@requestnetwork/types';
import Utils from '@requestnetwork/utils';

import Block from './block';
import IntervalTimer from './interval-timer';
import LocationByTopic from './location-by-topic';
import TimestampByLocation from './timestamp-by-location';

// Default interval time for auto synchronization
const DEFAULT_INTERVAL_TIME: number = 10000;

/**
 * Implementation of Data-Access layer without encryption
 */
export default class DataAccess implements DataAccessTypes.IDataAccess {
  // DataId (Id of data on storage layer) indexed by transaction topic
  // Will be used to get the data from storage with the transaction topic
  private locationByTopic?: LocationByTopic;

  // Timestamp of the dataIds
  // Will be used to get the data from timestamp boundaries
  private timestampByLocation: TimestampByLocation;

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
   * @param number synchronizationIntervalTime Interval time between each synchronization
   */
  public constructor(
    storage: StorageTypes.IStorage,
    synchronizationIntervalTime: number = DEFAULT_INTERVAL_TIME,
  ) {
    this.storage = storage;
    this.lastSyncedTimeStamp = 0;
    this.synchronizationTimer = new IntervalTimer(
      (): Promise<void> => this.synchronizeNewDataIds(),
      synchronizationIntervalTime,
    );
    this.timestampByLocation = new TimestampByLocation();
  }

  /**
   * Function to initialize the dataId topic with the previous block
   */
  public async initialize(): Promise<void> {
    this.initializeEmpty();
    if (!this.locationByTopic) {
      throw new Error('locationByTopic should be created');
    }

    // initialize the dataId topic with the previous block
    const allDataIdsWithMeta = await this.storage.getDataId();

    // The last synced timestamp is the current timestamp
    this.lastSyncedTimeStamp = Utils.getCurrentTimestampInSecond();

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
    if (!this.locationByTopic) {
      throw new Error('DataAccess must be initialized');
    }

    // create a block and add the transaction in it
    const updatedBlock = Block.pushTransaction(
      Block.createEmptyBlock(),
      transaction,
      channelId,
      topics,
    );
    // get the topic of the data in storage
    const resultAppend = await this.storage.append(JSON.stringify(updatedBlock));

    // topic the dataId with block topic
    this.locationByTopic.pushStorageLocationIndexedWithBlockTopics(
      resultAppend.result.dataId,
      updatedBlock.header,
    );

    // add the timestamp in the index
    this.timestampByLocation.pushTimestampByLocation(
      resultAppend.result.dataId,
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
    if (!this.locationByTopic) {
      throw new Error('DataAccess must be initialized');
    }

    // Gets the list of locationStorage indexed by the channel id that are within the boundaries
    const storageLocationList = this.locationByTopic
      .getStorageLocationsFromChannelId(channelId)
      .filter(dataId => this.timestampByLocation.isDataInBoundaries(dataId, timestampBoundaries));

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
    if (!this.locationByTopic) {
      throw new Error('DataAccess must be initialized');
    }

    // Gets the list of locationStorage grouped by channel id for the topic given
    const storageLocationByChannelId = this.locationByTopic.getStorageLocationFromTopicGroupedByChannelId(
      topic,
    );

    let channelIds = Object.keys(storageLocationByChannelId);

    // Filters the channels to only keep the modified ones during the time boundaries
    if (updatedBetween) {
      channelIds = channelIds.filter(channelId => {
        return storageLocationByChannelId[channelId].find(dataId =>
          this.timestampByLocation.isDataInBoundaries(dataId, updatedBetween),
        );
      });
    }

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
    if (!this.locationByTopic) {
      throw new Error('DataAccess must be initialized');
    }
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
    if (!this.locationByTopic) {
      throw new Error('DataAccess must be initialized');
    }

    this.synchronizationTimer.start();
  }

  /**
   * Stop to synchronize with the storage automatically
   */
  public stopAutoSynchronization(): void {
    this.synchronizationTimer.stop();
  }

  /**
   * Creates an empty LocationByTopic
   *
   * @protected
   * @memberof DataAccess
   */
  protected initializeEmpty(): void {
    if (this.locationByTopic) {
      throw new Error('already initialized');
    }
    this.locationByTopic = new LocationByTopic();
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
  ): Promise<void> {
    if (!this.locationByTopic) {
      throw new Error('DataAccess must be initialized');
    }
    if (!dataIdsWithMeta.result) {
      throw Error(`data from storage do not follow the standard, result is missing`);
    }

    for (const dataId of dataIdsWithMeta.result.dataIds) {
      const resultRead = await this.storage.read(dataId);

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
        throw Error(`data from storage do not follow the standard, storage location: "${dataId}"`);
      }

      // topic the previous dataId with their block topic
      this.locationByTopic.pushStorageLocationIndexedWithBlockTopics(dataId, block.header);

      // add the timestamp in the index
      this.timestampByLocation.pushTimestampByLocation(dataId, resultRead.meta.timestamp);
    }
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
}
