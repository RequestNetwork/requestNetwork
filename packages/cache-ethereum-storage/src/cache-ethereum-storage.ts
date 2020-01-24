import { LogTypes, StorageTypes } from '@requestnetwork/types';
import Utils from '@requestnetwork/utils';
import * as Bluebird from 'bluebird';
import { EventEmitter } from 'events';

/**
 * CacheEthereumStorage
 * @notice Manages storage layer of the Request Network Protocol v2
 */
export default class CacheEthereumStorage implements StorageTypes.IStorage {
  /**
   * Logger instance
   */
  private logger: LogTypes.ILogger;

  // TODO replace by database, files or something...
  private data: { [id: string]: { content: string; timestamp: number } | null };

  /**
   * Url where can be reached the data hosted by this storage
   */
  private locationUrl: string;

  private ethereumStorage: StorageTypes.IStorage;

  private isInitialized: boolean = false;

  /**
   * Constructor
   */
  public constructor(
    ethereumStorage: StorageTypes.IStorage,
    locationUrl: string,
    logger?: LogTypes.ILogger,
  ) {
    this.ethereumStorage = ethereumStorage;
    this.locationUrl = locationUrl;
    this.logger = logger || new Utils.SimpleLogger();
    this.data = {};
  }

  /**
   * Initialize the module. Does nothing, exists only to implement IStorage
   *
   * @returns nothing
   */
  public async initialize(): Promise<void> {
    // initialize storage
    await this.ethereumStorage.initialize();

    this.isInitialized = true;
  }

  /**
   * Append content into the storage: add the content to ipfs and the hash on Ethereum
   * @param content Content to add into the storage
   * @returns Promise resolving id used to retrieve the content
   */
  public async append(content: string): Promise<StorageTypes.IAppendResult> {
    if (!this.isInitialized) {
      throw new Error('Ethereum storage must be initialized');
    }

    if (!content) {
      throw Error('No content provided');
    }

    const result: StorageTypes.IAppendResult = Object.assign(new EventEmitter(), {
      content,
      // will be set up later
      id: '',
      meta: {
        // will be set up later
        ipfs: { size: 0 },
        storageType: StorageTypes.StorageSystemType.ETHEREUM_IPFS,
        timestamp: Utils.getCurrentTimestampInSecond(),
      },
    });

    const resultAppend = await this.ethereumStorage.append(content);

    resultAppend.on('confirmed', (resultAppendConfirmed: StorageTypes.IAppendResult) => {
      // Remove cache
      this.data[resultAppend.id] = null;

      result.emit('confirmed', resultAppendConfirmed);
    });

    // Store in the cache
    this.data[resultAppend.id] = { content, timestamp: resultAppend.meta.timestamp };

    result.id = resultAppend.id;
    // TODO Should we add cache?
    // result.id = `cache:${resultAppend.id}`;
    result.meta.ipfs = resultAppend.meta.ipfs;
    result.meta.timestamp = resultAppend.meta.timestamp;
    result.meta.local = { location: this.locationUrl };
    result.meta.storageType = StorageTypes.StorageSystemType.LOCAL;

    return result;
  }

  /**
   * Read content from the storage
   * @param Id Id used to retrieve content
   * @returns Promise resolving content from id
   */
  public async read(id: string): Promise<StorageTypes.IEntry> {
    if (!this.isInitialized) {
      throw new Error('Ethereum storage must be initialized');
    }

    if (!id) {
      throw Error('No id provided');
    }

    try {
      // return the data from the ethereum storage
      return await this.ethereumStorage.read(id);
    } catch (error) {
      // if not found, check the cache
      const cache = this.data[id];
      if (!cache) {
        throw Error('No content found from this id');
      }

      const { content, timestamp } = cache;

      // return the cache information
      return {
        content,
        id,
        meta: {
          local: { location: this.locationUrl },
          storageType: StorageTypes.StorageSystemType.LOCAL,
          timestamp,
        },
      };
    }
  }

  /**
   * Read a list of content from the storage
   *
   * @param dataIds A list of dataIds used to retrieve the content
   * @returns Promise resolving the list of contents
   */
  public async readMany(dataIds: string[]): Promise<StorageTypes.IEntry[]> {
    if (!this.isInitialized) {
      throw new Error('Ethereum storage must be initialized');
    }

    const totalCount = dataIds.length;
    // Concurrently get all the content from the id's in the parameters
    return Bluebird.map(dataIds, async (dataId, currentIndex) => {
      const startTime = Date.now();
      const data = await this.read(dataId);
      this.logger.debug(
        `[${currentIndex + 1}/${totalCount}] read ${dataId}. Took ${Date.now() - startTime} ms`,
        ['read', 'cache'],
      );
      return data;
    });
  }

  /**
   * Get all data stored on the storage
   *
   * @param boundaries timestamp boundaries for the data retrieval
   * @returns Promise resolving stored data
   */
  public async getData(
    boundaries?: StorageTypes.ITimestampBoundaries,
  ): Promise<StorageTypes.IEntriesWithLastTimestamp> {
    if (!this.isInitialized) {
      throw new Error('Ethereum storage must be initialized');
    }

    const entries = [];
    let lastTimestamp = 0;

    // tslint:disable-next-line:forin
    for (const id in this.data) {
      const cache = this.data[id];
      if (cache) {
        const timestamp = cache.timestamp;
        if (
          !boundaries ||
          ((boundaries.from === undefined || boundaries.from <= timestamp) &&
            (boundaries.to === undefined || boundaries.to >= timestamp))
        ) {
          entries.push({
            content: cache.content,
            id,
            meta: { local: { location: this.locationUrl }, timestamp },
          });
          lastTimestamp = timestamp > lastTimestamp ? timestamp : lastTimestamp;
        }
      }
    }

    return {
      entries,
      lastTimestamp,
    };
  }
}
