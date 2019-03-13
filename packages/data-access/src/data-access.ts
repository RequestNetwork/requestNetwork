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

    // check if the data returned by getDataId are correct
    // if yes, the dataIds are indexed with LocationByTopic
    await this.pushLocationsWithTopicsFromDataIds(allDataIdsWithMeta);
  }

  /**
   * Function to persist transaction and topic in storage
   * For now, we create a block for each transaction
   *
   * @param string transaction transaction to persist
   * @param string[] topics list of string to topic the transaction
   *
   * @returns string dataId where the transaction is stored
   */
  public async persistTransaction(
    transaction: DataAccessTypes.ITransaction,
    topics: string[] = [],
  ): Promise<DataAccessTypes.IReturnPersistTransaction> {
    if (!this.locationByTopic) {
      throw new Error('DataAccess must be initialized');
    }

    // create a block and add the transaction in it
    const updatedBlock = Block.pushTransaction(Block.createEmptyBlock(), transaction, topics);
    // get the topic of the data in storage
    const resultAppend = await this.storage.append(JSON.stringify(updatedBlock));

    // topic the dataId with block topic
    this.locationByTopic.pushLocationIndexedWithBlockTopics(
      resultAppend.result.dataId,
      updatedBlock.header.topics,
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
   * Function to get a list of transactions indexed by topic
   *
   * @param topic topic to retrieve the transaction from
   * @param timestampBoundaries timestamp boundaries of the transactions search
   *
   * @returns list of transactions indexed by topic
   */
  public async getTransactionsByTopic(
    topic: string,
    timestampBoundaries?: DataAccessTypes.ITimestampBoundaries,
  ): Promise<DataAccessTypes.IReturnGetTransactionsByTopic> {
    if (!this.locationByTopic) {
      throw new Error('DataAccess must be initialized');
    }

    const locationStorageList = this.locationByTopic
      .getLocationFromTopic(topic)
      .filter(dataId => this.timestampByLocation.isDataInBoundaries(dataId, timestampBoundaries));

    const blockWithMetaList: any[] = [];

    // get blocks indexed by topic
    for (const location of locationStorageList) {
      const resultRead = await this.storage.read(location);

      blockWithMetaList.push({
        block: JSON.parse(resultRead.result.content),
        location,
        meta: resultRead.meta,
      });
    }
    // get transactions indexed by topic in the blocks
    // 1. get the transactions wanted in each block
    // 2. merge all the transactions array in the same array
    const transactions: DataAccessTypes.ITransaction[] = Utils.flatten2DimensionsArray(
      blockWithMetaList.map(blockAndMeta =>
        blockAndMeta.block.header.topics[topic].map(
          (position: number) => blockAndMeta.block.transactions[position],
        ),
      ),
    );

    // Generate the list of storage location of the transactions listed in result
    const transactionsStorageLocation: string[] = Utils.flatten2DimensionsArray(
      blockWithMetaList.map(blockAndMeta =>
        Array(blockAndMeta.block.header.topics[topic].length).fill(blockAndMeta.location),
      ),
    );

    // Generate the list of storage meta of the transactions listed in result
    const storageMeta: string[] = Utils.flatten2DimensionsArray(
      blockWithMetaList.map(blockAndMeta =>
        Array(blockAndMeta.block.header.topics[topic].length).fill(blockAndMeta.meta),
      ),
    );

    return {
      meta: {
        storageMeta,
        transactionsStorageLocation,
      },
      result: { transactions },
    };
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
      this.locationByTopic.pushLocationIndexedWithBlockTopics(dataId, block.header.topics);

      // add the timestamp in the index
      this.timestampByLocation.pushTimestampByLocation(dataId, resultRead.meta.timestamp);
    }
  }
}
