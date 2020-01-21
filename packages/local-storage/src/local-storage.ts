import { LogTypes, StorageTypes } from '@requestnetwork/types';
import Utils from '@requestnetwork/utils';
import * as Bluebird from 'bluebird';

const ipfsClient = require('ipfs-http-client');

/**
 * LocalStorage
 * @notice Manages storage layer of the Request Network Protocol v2
 */
export default class LocalStorage implements StorageTypes.IStorage {
  // ipfs object to
  private static ipfs: any = ipfsClient();

  /**
   * Logger instance
   */
  private logger: LogTypes.ILogger;

  // TODO replace by database, files or something...
  private data: { [id: string]: { content: string; timestamp: number } };

  /**
   * Url where can be reached the data hosted by this storage
   */
  private locationUrl: string;

  /**
   * Constructor
   */
  public constructor(locationUrl: string, logger?: LogTypes.ILogger) {
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
    // no-op, nothing to do
    return;
  }

  /**
   * Append content into the storage: add the content to ipfs and the hash on Ethereum
   * @param content Content to add into the storage
   * @returns Promise resolving id used to retrieve the content
   */
  public async append(content: string): Promise<StorageTypes.IEntry> {
    if (!content) {
      throw Error('No content provided');
    }

    const ipfsHash = await this.getIPFSHash(content);
    const dataId: string = `cache:${ipfsHash}`;

    // if already stored
    if (this.data[dataId]) {
      throw Error('This content has been already stored.');
    }

    const timestamp = Utils.getCurrentTimestampInSecond();
    const local = { location: this.locationUrl };

    this.data[dataId] = { content, timestamp };

    return {
      content,
      id: dataId,
      meta: {
        local,
        storageType: StorageTypes.StorageSystemType.LOCAL,
        timestamp,
      },
    };
  }

  /**
   * Read content from the storage
   * @param Id Id used to retrieve content
   * @returns Promise resolving content from id
   */
  public async read(id: string): Promise<StorageTypes.IEntry> {
    if (!id) {
      throw Error('No id provided');
    }
    if (!this.data[id]) {
      throw Error('No content found from this id');
    }

    const { content, timestamp } = this.data[id];

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

  /**
   * Read a list of content from the storage
   *
   * @param dataIds A list of dataIds used to retrieve the content
   * @returns Promise resolving the list of contents
   */
  public async readMany(dataIds: string[]): Promise<StorageTypes.IEntry[]> {
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
    const entries = [];
    let lastTimestamp = 0;

    // tslint:disable-next-line:forin
    for (const id in this.data) {
      const timestamp = this.data[id].timestamp;
      if (
        !boundaries ||
        ((boundaries.from === undefined || boundaries.from <= timestamp) &&
          (boundaries.to === undefined || boundaries.to >= timestamp))
      ) {
        entries.push({
          content: this.data[id].content,
          id,
          meta: { local: { location: this.locationUrl }, timestamp },
        });
        lastTimestamp = timestamp > lastTimestamp ? timestamp : lastTimestamp;
      }
    }

    return {
      entries,
      lastTimestamp,
    };
  }

  public async getIPFSHash(content: string): Promise<string> {
    const ipfsData = await LocalStorage.ipfs.add(content, { onlyHash: true });
    return ipfsData[0].hash;
  }
}
