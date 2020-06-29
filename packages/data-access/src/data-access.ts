import MultiFormat from '@requestnetwork/multi-format';
import { DataAccessTypes, LogTypes, StorageTypes } from '@requestnetwork/types';
import Utils from '@requestnetwork/utils';

import * as Bluebird from 'bluebird';
import { EventEmitter } from 'events';

import Block from './block';
import IgnoredLocationIndex from './ignored-location';
import IntervalTimer from './interval-timer';
import TransactionIndex from './transaction-index';

// Default interval time for auto synchronization
const DEFAULT_INTERVAL_TIME: number = 10000;

/**
 * Options for the DataAccess initialization
 */
export interface IDataAccessOptions {
  /**
   * Logger instance
   */
  logger?: LogTypes.ILogger;

  /**
   *  the transaction index, defaults to TransactionIndex if not set.
   */
  transactionIndex?: DataAccessTypes.ITransactionIndex;

  /**
   * synchronizationIntervalTime Interval time between each synchronization
   * Defaults to DEFAULT_INTERVAL_TIME.
   */
  synchronizationIntervalTime?: number;

  /**
   * Index of the ignored location with the reason
   */
  ignoredLocationIndex?: IgnoredLocationIndex;
}

/**
 * Implementation of Data-Access layer without encryption
 */
export default class DataAccess implements DataAccessTypes.IDataAccess {
  // Transaction index, that allows storing and retrieving transactions by channel or topic, with time boundaries.
  // public for test purpose
  public transactionIndex: DataAccessTypes.ITransactionIndex;

  // boolean to store the initialization state
  protected isInitialized: boolean = false;
  // Storage layer
  private storage: StorageTypes.IStorage;

  private ignoredLocationIndex: IgnoredLocationIndex;

  // The function used to synchronize with the storage should be called periodically
  // This object allows to handle the periodical call of the function
  private synchronizationTimer: IntervalTimer;

  // Timestamp of the last synchronization
  //
  // Are you debugging and this value is not changing as much as you think it should? Read bellow.
  // ATTENTION: This value should be updated with the lastTimestamp returned by the storage
  // and never with `now` timestamp. For example, if storage is using ethereum, it may add new blocks
  // between the most recent block and the current timestamp. This may lead to blocks being skipped.
  private lastSyncStorageTimestamp: number;

  /**
   * Logger instance
   */
  private logger: LogTypes.ILogger;

  /**
   * Constructor DataAccess interface
   *
   * @param IStorage storage storage object
   * @param options
   */
  public constructor(storage: StorageTypes.IStorage, options?: IDataAccessOptions) {
    const defaultOptions: IDataAccessOptions = {
      ignoredLocationIndex: new IgnoredLocationIndex(),
      logger: new Utils.SimpleLogger(),
      synchronizationIntervalTime: DEFAULT_INTERVAL_TIME,
      transactionIndex: new TransactionIndex(),
    };
    options = {
      ...defaultOptions,
      ...options,
    };
    this.storage = storage;
    this.lastSyncStorageTimestamp = 0;
    this.synchronizationTimer = new IntervalTimer(
      (): Promise<void> => this.synchronizeNewDataIds(),
      options.synchronizationIntervalTime!,
      options.logger!,
      5,
    );
    this.transactionIndex = options.transactionIndex!;
    this.ignoredLocationIndex = options.ignoredLocationIndex!;

    this.logger = options.logger!;
  }

  /**
   * Function to initialize the dataId topic with the previous block
   */
  public async initialize(): Promise<void> {
    if (this.isInitialized) {
      throw new Error('already initialized');
    }
    await this.transactionIndex.initialize();

    // initialize storage
    await this.storage.initialize();

    // if transaction index already has data, then sync from the last available timestamp
    const lastSynced = await this.transactionIndex.getLastTransactionTimestamp();
    const now = Utils.getCurrentTimestampInSecond();

    // initialize the dataId topic with the previous block
    const allDataWithMeta = await this.storage.getData(
      lastSynced
        ? {
            from: lastSynced,
            to: now,
          }
        : undefined,
    );

    // The last synced timestamp is the latest one returned by storage
    this.lastSyncStorageTimestamp = allDataWithMeta.lastTimestamp;

    // check if the data returned by getData are correct
    // if yes, the dataIds are indexed with LocationByTopic
    await this.pushLocationsWithTopics(allDataWithMeta.entries);

    this.isInitialized = true;
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

    // get all the topics not well formatted
    const notFormattedTopics: string[] = topics.filter(
      topic => !MultiFormat.hashFormat.isDeserializableString(topic),
    );

    if (notFormattedTopics.length !== 0) {
      throw new Error(
        `The following topics are not well formatted: ${JSON.stringify(notFormattedTopics)}`,
      );
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

    const result: DataAccessTypes.IReturnPersistTransaction = Object.assign(new EventEmitter(), {
      meta: {
        storageMeta: resultAppend.meta,
        topics,
        transactionStorageLocation: resultAppend.id,
      },
      result: {},
    });

    // Store the data to the real storage
    resultAppend
      .on('confirmed', async (resultAppendConfirmed: StorageTypes.IAppendResult) => {
        // update the timestamp with the confirmed one
        await this.transactionIndex.updateTimestamp(
          resultAppendConfirmed.id,
          resultAppendConfirmed.meta.timestamp,
        );

        const resultAfterConfirmation = {
          meta: {
            storageMeta: resultAppendConfirmed.meta,
            topics,
            transactionStorageLocation: resultAppendConfirmed.id,
          },
          result: {},
        };

        result.emit('confirmed', resultAfterConfirmation);
      })
      .on('error', async error => {
        result.emit('error', error);
      });

    // adds this transaction to the index, to enable retrieving it later.
    await this.transactionIndex.addTransaction(
      resultAppend.id,
      updatedBlock.header,
      resultAppend.meta.timestamp,
    );

    return result;
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
      transactions: DataAccessTypes.ITimestampedTransaction[];
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
   * @param topic topic to retrieve the channels from
   * @param updatedBetween filter the channels that have received new data within the time boundaries
   *
   * @returns list of channels indexed by topic
   */
  public async getChannelsByTopic(
    topic: string,
    updatedBetween?: DataAccessTypes.ITimestampBoundaries,
  ): Promise<DataAccessTypes.IReturnGetChannelsByTopic> {
    this.checkInitialized();

    // check if the topic is well formatted
    if (!MultiFormat.hashFormat.isDeserializableString(topic)) {
      throw new Error(`The topic is not well formatted: ${topic}`);
    }

    const channelIds = await this.transactionIndex.getChannelIdsForTopic(topic, updatedBetween);

    // Gets the transactions per channel id
    const transactionsAndMeta = Bluebird.map(channelIds, channelId =>
      this.getTransactionsByChannelId(channelId).then(transactionsWithMeta => ({
        channelId,
        transactionsWithMeta,
      })),
    );

    // Gather all the transactions in one object
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
   * Function to get a list of channels indexed by multiple topics
   *
   * @param topics topics to retrieve the channels from
   * @param updatedBetween filter the channels that have received new data within the time boundaries
   *
   * @returns list of channels indexed by topics
   */
  public async getChannelsByMultipleTopics(
    topics: string[],
    updatedBetween?: DataAccessTypes.ITimestampBoundaries,
  ): Promise<DataAccessTypes.IReturnGetChannelsByTopic> {
    this.checkInitialized();

    if (topics.some(topic => !MultiFormat.hashFormat.isDeserializableString(topic))) {
      throw new Error(`The topics are not well formatted`);
    }

    const channelIds: string[] = await this.transactionIndex.getChannelIdsForMultipleTopics(
      topics,
      updatedBetween,
    );

    // Gets the transactions per channel id
    const transactionsAndMeta = Bluebird.map(channelIds, channelId =>
      this.getTransactionsByChannelId(channelId).then(transactionsWithMeta => ({
        channelId,
        transactionsWithMeta,
      })),
    );

    // Gather all the transactions in one object
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
    const synchronizationTo = Utils.getCurrentTimestampInSecond();

    // We increment lastSyncStorageTimestamp because the data located at lastSyncStorageTimestamp
    // 0 means it's the first synchronization
    let synchronizationFrom = 0;
    if (this.lastSyncStorageTimestamp > 0) {
      synchronizationFrom = this.lastSyncStorageTimestamp + 1;
    }

    // Read new data from storage
    const newDataWithMeta = await this.storage.getData({
      from: synchronizationFrom,
      to: synchronizationTo,
    });

    // Try to get some data previously ignored
    const oldEntriesWithMeta = await this.storage.getIgnoredData();

    // check if the data returned by getNewDataId are correct
    // if yes, the dataIds are indexed with LocationByTopic
    await this.pushLocationsWithTopics(newDataWithMeta.entries.concat(oldEntriesWithMeta));

    // The last synced timestamp is the latest one returned by storage
    this.lastSyncStorageTimestamp = newDataWithMeta.lastTimestamp;
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
   * Gets information of the data indexed
   *
   * @param detailed if true get the list of the files hashes
   */
  public async _getStatus(detailed: boolean = false): Promise<any> {
    this.checkInitialized();

    // last transaction timestamp retrieved
    const lastLocationTimestamp = await this.transactionIndex.getLastTransactionTimestamp();
    const listIndexedLocation = await this.transactionIndex.getIndexedLocations();
    const listIgnoredLocationIndex = await this.ignoredLocationIndex.getIgnoredLocations();

    const synchronizationConfig = this.synchronizationTimer.getConfig();

    return {
      filesIgnored: {
        count: Object.keys(listIgnoredLocationIndex).length,
        list: detailed ? listIgnoredLocationIndex : undefined,
      },
      filesRetrieved: {
        count: listIndexedLocation.length,
        lastTimestamp: lastLocationTimestamp,
        list: detailed ? listIndexedLocation : undefined,
      },
      lastSynchronizationTimestamp: this.lastSyncStorageTimestamp,
      storage: await this.storage._getStatus(detailed),
      synchronizationConfig,
    };
  }

  /**
   * Check the format of the data, extract the topics from it and push location indexed with the topics
   *
   * @private
   * @param entries data with meta from storage functions
   * @param locationByTopic LocationByTopic object to push location
   */
  private async pushLocationsWithTopics(entries: StorageTypes.IEntry[]): Promise<void> {
    if (!entries) {
      throw Error(`data from storage do not follow the standard`);
    }
    let parsingErrorCount = 0;
    let proceedCount = 0;
    await Bluebird.each(entries, async entry => {
      if (!entry.content || !entry.id) {
        throw Error(`data from storage do not follow the standard`);
      }

      let block;
      const blockString = entry.content;

      try {
        block = Block.parseBlock(blockString);
        proceedCount++;
        // adds this transaction to the index, to enable retrieving it later.
        await this.transactionIndex.addTransaction(entry.id, block.header, entry.meta.timestamp);
      } catch (e) {
        parsingErrorCount++;
        // Index ignored Location
        await this.ignoredLocationIndex.pushReasonByLocation(entry.id, e.message);
        this.logger.debug(`Error: can't parse content of the dataId (${entry.id}): ${e}`, [
          'synchronization',
        ]);
      }
    });

    this.logger.info(
      `Synchronization: ${proceedCount} blocks synchronized, ${parsingErrorCount} ignored from parsing error`,
      ['synchronization'],
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
    Array<{ block: DataAccessTypes.IBlock; meta: StorageTypes.IEntryMetadata; location: string }>
  > {
    // Gets blocks indexed by topic
    return Promise.all(
      storageLocationList.map(async location => {
        const resultRead = await this.storage.read(location);

        return {
          block: Block.parseBlock(resultRead.content),
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
    meta: StorageTypes.IEntryMetadata,
  ): {
    transactions: DataAccessTypes.ITimestampedTransaction[];
    transactionsStorageLocation: string[];
    storageMeta: string[];
  } {
    // Gets the transaction from the positions
    const transactions: DataAccessTypes.ITimestampedTransaction[] =
      // first remove de duplicates
      Utils.unique(transactionPositions).uniqueItems.map(
        // Get the transaction from their position and add the timestamp
        (position: number) => ({
          state:
            meta.state === StorageTypes.ContentState.CONFIRMED
              ? DataAccessTypes.TransactionState.CONFIRMED
              : DataAccessTypes.TransactionState.PENDING,
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
    if (!this.isInitialized) {
      throw new Error('DataAccess must be initialized');
    }
  }
}
