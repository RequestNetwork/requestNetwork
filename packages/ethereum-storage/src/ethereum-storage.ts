import { LogTypes, StorageTypes } from '@requestnetwork/types';
import Utils from '@requestnetwork/utils';
import * as Bluebird from 'bluebird';
import { EventEmitter } from 'events';
import { getMaxConcurrency } from './config';

import ethereumEntriesToIpfsContent from './ethereum-entries-to-ipfs-content';
import EthereumMetadataCache from './ethereum-metadata-cache';
import IgnoredDataIds from './ignored-dataIds';
import SmartContractManager from './smart-contract-manager';

import * as Keyv from 'keyv';

// time to wait before considering the web3 provider is not reachable
const WEB3_PROVIDER_TIMEOUT = 10000;

/**
 * EthereumStorage
 * @notice Manages storage layer of the Request Network Protocol v2
 */
export class EthereumStorage implements StorageTypes.IStorage {
  /**
   * Manager for the storage smart contract
   * This attribute is left public for mocking purpose to facilitate tests on the module
   */
  public smartContractManager: SmartContractManager;

  /**
   * Storage for IPFS
   */
  private ipfsStorage: StorageTypes.IIpfsStorage;

  /**
   * Cache to store Ethereum metadata
   */
  public ethereumMetadataCache: EthereumMetadataCache;

  /** Data ids ignored by the node */
  public ignoredDataIds: IgnoredDataIds;

  /**
   * Maximum number of concurrent calls
   */
  public maxConcurrency: number;

  /**
   * Timestamp of the dataId not mined on ethereum yet
   */
  private buffer: { [id: string]: number | undefined };

  /**
   * Url where can be reached the data buffered by this storage
   */
  private externalBufferUrl: string;

  /**
   * Logger instance
   */
  private logger: LogTypes.ILogger;

  private isInitialized = false;

  /**
   * Constructor
   * @param ipfsGatewayConnection Information structure to connect to the ipfs gateway
   * @param web3Connection Information structure to connect to the Ethereum network
   * @param [options.getLastBlockNumberDelay] the minimum delay to wait between fetches of lastBlockNumber
   * @param metadataStore a Keyv store to persist the metadata in ethereumMetadataCache
   */
  public constructor(
    externalBufferUrl: string,
    ipfsStorage: StorageTypes.IIpfsStorage,
    web3Connection?: StorageTypes.IWeb3Connection,
    {
      getLastBlockNumberDelay,
      logger,
      maxConcurrency,
      maxRetries,
      retryDelay,
    }: {
      getLastBlockNumberDelay?: number;
      logger?: LogTypes.ILogger;
      maxConcurrency?: number;
      maxRetries?: number;
      retryDelay?: number;
    } = {},
    metadataStore?: Keyv.Store<any>,
  ) {
    this.maxConcurrency = maxConcurrency || getMaxConcurrency();
    this.logger = logger || new Utils.SimpleLogger();
    this.ipfsStorage = ipfsStorage;
    this.smartContractManager = new SmartContractManager(web3Connection, {
      getLastBlockNumberDelay,
      logger: this.logger,
      maxConcurrency: this.maxConcurrency,
      maxRetries,
      retryDelay,
    });
    this.ethereumMetadataCache = new EthereumMetadataCache(metadataStore);
    this.ignoredDataIds = new IgnoredDataIds(metadataStore);
    this.buffer = {};
    this.externalBufferUrl = externalBufferUrl;
  }

  /**
   * Function to initialize the storage
   * Checks the connection with ipfs
   * Checks the connection with Ethereum
   * Adds the known IPFS node (ipfs swarm connect)
   */
  public async initialize(): Promise<void> {
    if (this.isInitialized) {
      throw new Error('ethereum-storage is already initialized');
    }

    // check ethereum node connection - will throw if the ethereum node is not reachable
    this.logger.info('Checking ethereum node connection', ['ethereum', 'sanity']);
    try {
      await this.smartContractManager.checkWeb3ProviderConnection(WEB3_PROVIDER_TIMEOUT);
    } catch (error) {
      throw Error(`Ethereum node is not accessible: ${error}`);
    }

    // check if contracts are deployed on ethereum
    this.logger.info('Checking ethereum node contract deployment', ['ethereum', 'sanity']);
    try {
      await this.smartContractManager.checkContracts();
    } catch (error) {
      throw Error(error);
    }

    // Check IPFS node state - will throw in case of error
    await this.ipfsStorage.initialize();

    this.isInitialized = true;
  }

  /**
   * Update Ethereum network connection information and reconnect
   * Missing value are filled with default config value
   * @param web3Connection Information structure to connect to the Ethereum network
   */
  public async updateEthereumNetwork(web3Connection: StorageTypes.IWeb3Connection): Promise<void> {
    this.smartContractManager = new SmartContractManager(web3Connection);
    // check ethereum node connection - will throw if the ethereum node is not reachable

    try {
      await this.smartContractManager.checkWeb3ProviderConnection(WEB3_PROVIDER_TIMEOUT);
    } catch (error) {
      throw Error(`Ethereum node is not accessible: ${error}`);
    }
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

    const { ipfsHash, ipfsSize } = await this.ipfsStorage.ipfsAdd(content);

    const timestamp = Utils.getCurrentTimestampInSecond();
    const result: StorageTypes.IAppendResult = Object.assign(new EventEmitter(), {
      content,
      id: ipfsHash,
      meta: {
        ipfs: { size: ipfsSize },
        local: { location: this.externalBufferUrl },
        state: StorageTypes.ContentState.PENDING,
        storageType: StorageTypes.StorageSystemType.LOCAL,
        timestamp,
      },
    });
    // store in the buffer the timestamp
    this.buffer[ipfsHash] = timestamp;

    const feesParameters: StorageTypes.IFeesParameters = { contentSize: ipfsSize };

    this.smartContractManager
      .addHashAndSizeToEthereum(ipfsHash, feesParameters)
      .then(async (ethereumMetadata: StorageTypes.IEthereumMetadata) => {
        const resultAfterBroadcast: StorageTypes.IEntry = {
          content,
          id: ipfsHash,
          meta: {
            ethereum: ethereumMetadata,
            ipfs: { size: ipfsSize },
            state: StorageTypes.ContentState.CONFIRMED,
            storageType: StorageTypes.StorageSystemType.ETHEREUM_IPFS,
            timestamp: ethereumMetadata.blockTimestamp,
          },
        };
        // Save the metadata of the new ipfsHash into the Ethereum metadata cache
        await this.ethereumMetadataCache.saveDataIdMeta(ipfsHash, ethereumMetadata);

        result.emit('confirmed', resultAfterBroadcast);
      })
      .catch((error) => {
        result.emit('error', error);
      });

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

    // Get Ethereum metadata
    let bufferTimestamp: number | undefined;

    // Check if the data as been added on ethereum
    const ethereumMetadata = await this.ethereumMetadataCache.getDataIdMeta(id);

    // Clear buffer if needed
    if (!ethereumMetadata) {
      bufferTimestamp = this.buffer[id];
      if (!bufferTimestamp) {
        throw Error('No content found from this id');
      }
    } else {
      delete this.buffer[id];
    }

    const ipfsObject = await this.ipfsStorage.read(id);

    const meta = ethereumMetadata
      ? {
          ethereum: ethereumMetadata,
          ipfs: { size: ipfsObject.ipfsSize },
          state: StorageTypes.ContentState.CONFIRMED,
          storageType: StorageTypes.StorageSystemType.ETHEREUM_IPFS,
          timestamp: ethereumMetadata.blockTimestamp,
        }
      : {
          ipfs: { size: ipfsObject.ipfsSize },
          local: { location: this.externalBufferUrl },
          state: StorageTypes.ContentState.PENDING,
          storageType: StorageTypes.StorageSystemType.LOCAL,
          timestamp: bufferTimestamp || 0,
        };

    return {
      content: ipfsObject.content,
      id,
      meta,
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
    return Bluebird.map(
      dataIds,
      async (dataId, currentIndex) => {
        const startTime = Date.now();
        const data = await this.read(dataId);
        this.logger.debug(
          `[${currentIndex + 1}/${totalCount}] read ${dataId}. Took ${Date.now() - startTime} ms`,
          ['read'],
        );
        return data;
      },
      {
        concurrency: this.maxConcurrency,
      },
    );
  }

  /**
   * Get all data stored on the storage
   *
   * @param options timestamp boundaries for the data retrieval
   * @returns Promise resolving stored data
   */
  public async getData(
    options?: StorageTypes.ITimestampBoundaries,
  ): Promise<StorageTypes.IEntriesWithLastTimestamp> {
    if (!this.isInitialized) {
      throw new Error('Ethereum storage must be initialized');
    }
    this.logger.info('Fetching dataIds from Ethereum', ['ethereum']);
    const { ethereumEntries, lastTimestamp } =
      await this.smartContractManager.getEntriesFromEthereum(options);

    // If no hash was found on ethereum, we return an empty list
    if (!ethereumEntries.length) {
      this.logger.info('No new data found.', ['ethereum']);
      return {
        entries: [],
        lastTimestamp,
      };
    }

    this.logger.debug('Fetching data from IPFS and checking correctness', ['ipfs']);

    const entries = await ethereumEntriesToIpfsContent(
      ethereumEntries,
      this.ipfsStorage,
      this.ignoredDataIds,
      this.logger,
      this.maxConcurrency,
    );

    const ids = entries.map((entry) => entry.id) || [];
    // Pin data asynchronously
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    this.ipfsStorage.pinDataToIPFS(ids);

    // Save existing ethereum metadata to the ethereum metadata cache
    for (const entry of entries) {
      const ethereumMetadata = entry.meta.ethereum;
      if (ethereumMetadata) {
        // PROT-504: The saving of dataId's metadata should be encapsulated when retrieving dataId inside smart contract (getPastEvents)
        await this.ethereumMetadataCache.saveDataIdMeta(entry.id, ethereumMetadata);
      }
    }

    return {
      entries,
      lastTimestamp,
    };
  }

  /**
   * Try to get some previous ignored data
   *
   * @param options timestamp boundaries for the data retrieval
   * @returns Promise resolving stored data
   */
  public async getIgnoredData(): Promise<StorageTypes.IEntry[]> {
    if (!this.isInitialized) {
      throw new Error('Ethereum storage must be initialized');
    }
    this.logger.info('Getting some previous ignored dataIds', ['ethereum']);

    const ethereumEntries: StorageTypes.IEthereumEntry[] =
      await this.ignoredDataIds.getDataIdsToRetry();

    // If no hash was found on ethereum, we return an empty list
    if (!ethereumEntries.length) {
      this.logger.info('No new data found.', ['ethereum']);
      return [];
    }

    this.logger.debug('Fetching data from IPFS and checking correctness', ['ipfs']);

    const entries = await ethereumEntriesToIpfsContent(
      ethereumEntries,
      this.ipfsStorage,
      this.ignoredDataIds,
      this.logger,
      this.maxConcurrency,
    );

    const ids = entries.map((entry) => entry.id) || [];
    // Pin data asynchronously
    void this.ipfsStorage.pinDataToIPFS(ids);

    // Save existing ethereum metadata to the ethereum metadata cache
    for (const entry of entries) {
      const ethereumMetadata = entry.meta.ethereum;
      if (ethereumMetadata) {
        // PROT-504: The saving of dataId's metadata should be encapsulated when retrieving dataId inside smart contract (getPastEvents)
        await this.ethereumMetadataCache.saveDataIdMeta(entry.id, ethereumMetadata);
      }
    }

    return entries;
  }

  /**
   * Get Information on the dataIds retrieved and ignored by the ethereum storage
   *
   * @param detailed if true get the list of the files hash
   * @returns Promise resolving object with dataIds retrieved and ignored
   */
  public async _getStatus(detailed = false): Promise<any> {
    const dataIds = await this.ethereumMetadataCache.getDataIds();
    const dataIdsWithReason = await this.ignoredDataIds.getDataIdsWithReasons();

    const ethereum = this.smartContractManager.getConfig();
    const ipfs = await this.ipfsStorage.getConfig();

    return {
      dataIds: {
        count: dataIds.length,
        values: detailed ? dataIds : undefined,
      },
      ethereum,
      ignoredDataIds: {
        count: Object.keys(dataIdsWithReason).length,
        values: detailed ? dataIdsWithReason : undefined,
      },
      ipfs,
    };
  }
}
