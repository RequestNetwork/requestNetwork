import { LogTypes, StorageTypes } from '@requestnetwork/types';
import Utils from '@requestnetwork/utils';
import * as Bluebird from 'bluebird';
import { EventEmitter } from 'events';
import { getIpfsExpectedBootstrapNodes, getMaxConcurrency, getPinRequestConfig } from './config';

import ethereumEntriesToIpfsContent from './ethereum-entries-to-ipfs-content';
import EthereumMetadataCache from './ethereum-metadata-cache';
import IgnoredDataIds from './ignored-dataIds';
import IpfsManager from './ipfs-manager';
import SmartContractManager from './smart-contract-manager';

import * as Keyv from 'keyv';

// time to wait before considering the web3 provider is not reachable
const WEB3_PROVIDER_TIMEOUT: number = 10000;

/**
 * EthereumStorage
 * @notice Manages storage layer of the Request Network Protocol v2
 */
export default class EthereumStorage implements StorageTypes.IStorage {
  /**
   * Manager for the storage smart contract
   * This attribute is left public for mocking purpose to facilitate tests on the module
   */
  public smartContractManager: SmartContractManager;

  /**
   * Manager for IPFS
   * This attribute is left public for mocking purpose to facilitate tests on the module
   */
  public ipfsManager: IpfsManager;

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

  private isInitialized: boolean = false;

  /**
   * Constructor
   * @param ipfsGatewayConnection Information structure to connect to the ipfs gateway
   * @param web3Connection Information structure to connect to the Ethereum network
   * @param [options.getLastBlockNumberDelay] the minimum delay to wait between fetches of lastBlockNumber
   * @param metadataStore a Keyv store to persist the metadata in ethereumMetadataCache
   */
  public constructor(
    externalBufferUrl: string,
    ipfsGatewayConnection?: StorageTypes.IIpfsGatewayConnection,
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
    this.ipfsManager = new IpfsManager(ipfsGatewayConnection);
    this.smartContractManager = new SmartContractManager(web3Connection, {
      getLastBlockNumberDelay,
      logger: this.logger,
      maxConcurrency: this.maxConcurrency,
      maxRetries,
      retryDelay,
    });
    this.ethereumMetadataCache = new EthereumMetadataCache(
      this.smartContractManager,
      metadataStore,
    );
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
    await this.checkIpfsNode();

    this.isInitialized = true;
  }

  /**
   * Update gateway connection information and connect to the new gateway
   * Missing value are filled with default config value
   * @param ipfsConnection Information structure to connect to the ipfs gateway
   */
  public async updateIpfsGateway(
    ipfsGatewayConnection: StorageTypes.IIpfsGatewayConnection,
  ): Promise<void> {
    this.ipfsManager = new IpfsManager(ipfsGatewayConnection);

    // Check IPFS node state - will throw in case of error
    await this.checkIpfsNode();
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

    if (!content) {
      throw Error('No content provided');
    }

    // Add content to IPFS and get the hash back
    let ipfsHash: string;
    try {
      ipfsHash = await this.ipfsManager.add(content);
    } catch (error) {
      throw Error(`Ipfs add request error: ${error}`);
    }

    // Get content length from ipfs
    let contentSize: number;
    try {
      contentSize = await this.ipfsManager.getContentLength(ipfsHash);
    } catch (error) {
      throw Error(`Ipfs get length request error: ${error}`);
    }

    const timestamp = Utils.getCurrentTimestampInSecond();
    const result: StorageTypes.IAppendResult = Object.assign(new EventEmitter(), {
      content,
      id: ipfsHash,
      meta: {
        ipfs: { size: contentSize },
        local: { location: this.externalBufferUrl },
        state: StorageTypes.ContentState.PENDING,
        storageType: StorageTypes.StorageSystemType.LOCAL,
        timestamp,
      },
    });
    // store in the buffer the timestamp
    this.buffer[ipfsHash] = timestamp;

    const feesParameters: StorageTypes.IFeesParameters = { contentSize };

    this.smartContractManager
      .addHashAndSizeToEthereum(ipfsHash, feesParameters)
      .then(async (ethereumMetadata: StorageTypes.IEthereumMetadata) => {
        const resultAfterBroadcast: StorageTypes.IEntry = {
          content,
          id: ipfsHash,
          meta: {
            ethereum: ethereumMetadata,
            ipfs: { size: contentSize },
            state: StorageTypes.ContentState.CONFIRMED,
            storageType: StorageTypes.StorageSystemType.ETHEREUM_IPFS,
            timestamp: ethereumMetadata.blockTimestamp,
          },
        };
        // Save the metadata of the new ipfsHash into the Ethereum metadata cache
        await this.ethereumMetadataCache.saveDataIdMeta(ipfsHash, ethereumMetadata);

        result.emit('confirmed', resultAfterBroadcast);
      })
      .catch(error => {
        result.emit('error', error);
      });

    return result;
  }

  /**
   * Add the content to ipfs
   * To be used only in case of persisting the hash on ethereum outside the storage
   *
   * @param content Content to add into the storage
   * @returns Promise resolving id used to retrieve the content
   */
  public async _ipfsAdd(data: string): Promise<StorageTypes.IIpfsMeta> {
    if (!this.isInitialized) {
      throw new Error('Ethereum storage must be initialized');
    }

    if (!data) {
      throw Error('No data provided');
    }

    // Add a small check to at least having JSON data added
    try {
      JSON.parse(data);
    } catch (error) {
      throw Error(`data not JSON parsable: ${error}`);
    }

    // Add content to IPFS and get the hash back
    let ipfsHash;
    try {
      ipfsHash = await this.ipfsManager.add(data);
    } catch (error) {
      throw Error(`Ipfs add request error: ${error}`);
    }

    // Get content length from ipfs
    let ipfsSize;
    try {
      ipfsSize = await this.ipfsManager.getContentLength(ipfsHash);
    } catch (error) {
      throw new Error(`Ipfs get length request error: ${error}`);
    }

    return {
      ipfsHash,
      ipfsSize,
    };
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
    let ethereumMetadata;
    let bufferTimestamp: number | undefined;
    let ipfsObject;
    try {
      // Check if the data as been added on ethereum
      ethereumMetadata = await this.ethereumMetadataCache.getDataIdMeta(id);

      // Clear buffer if needed
      if (this.buffer[id]) {
        this.buffer[id] = undefined;
      }
    } catch (error) {
      // if not found, check the buffer
      bufferTimestamp = this.buffer[id];
      if (!bufferTimestamp) {
        throw Error('No content found from this id');
      }
    }

    // Send ipfs request
    try {
      ipfsObject = await this.ipfsManager.read(id);
    } catch (error) {
      throw Error(`Ipfs read request error: ${error}`);
    }

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
    const contentDataIdAndMeta = await this.getContentAndDataId(options);

    return contentDataIdAndMeta;
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

    const ethereumEntries: StorageTypes.IEthereumEntry[] = await this.ignoredDataIds.getDataIdsToRetry();

    // If no hash was found on ethereum, we return an empty list
    if (!ethereumEntries.length) {
      this.logger.info('No new data found.', ['ethereum']);
      return [];
    }

    this.logger.debug('Fetching data from IPFS and checking correctness', ['ipfs']);

    const entries = await ethereumEntriesToIpfsContent(
      ethereumEntries,
      this.ipfsManager,
      this.ignoredDataIds,
      this.logger,
      this.maxConcurrency,
    );

    const ids = entries.map(entry => entry.id) || [];
    // Pin data asynchronously
    // tslint:disable-next-line:no-floating-promises
    this.pinDataToIPFS(ids);

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
   * Pin an array of IPFS hashes
   *
   * @param hashes An array of IPFS hashes to pin
   */
  public async pinDataToIPFS(
    hashes: string[],
    {
      delayBetweenCalls,
      maxSize,
      timeout,
    }: StorageTypes.IPinRequestConfiguration = getPinRequestConfig(),
  ): Promise<void> {
    // How many slices we need from the total list of hashes to be under pinRequestMaxSize
    const slices = Math.ceil(hashes.length / maxSize);

    // Iterate over the hashes list, slicing it at pinRequestMaxSize sizes and pinning it
    for (let i = 0; i < slices; i++) {
      await new Promise((res): NodeJS.Timeout => setTimeout(() => res(), delayBetweenCalls));
      const slice = hashes.slice(i * maxSize, (i + 1) * maxSize);
      try {
        await this.ipfsManager.pin(slice, timeout);
        this.logger.debug(`Pinned ${slice.length} hashes to IPFS node.`);
      } catch (error) {
        this.logger.warn(`Failed pinning some hashes the IPFS node: ${error}`, ['ipfs']);
      }
    }
  }

  /**
   * Get Information on the dataIds retrieved and ignored by the ethereum storage
   *
   * @param detailed if true get the list of the files hash
   * @returns Promise resolving object with dataIds retrieved and ignored
   */
  public async _getStatus(detailed: boolean = false): Promise<any> {
    const dataIds = await this.ethereumMetadataCache.getDataIds();
    const dataIdsWithReason = await this.ignoredDataIds.getDataIdsWithReasons();

    const ethereum = this.smartContractManager.getConfig();
    const ipfs = await this.ipfsManager.getConfig();

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

  /**
   * Get all dataId and the contents stored on the storage
   *
   * @param options timestamp boundaries for the data id retrieval
   * @returns Promise resolving object with content and dataId of stored data
   */
  private async getContentAndDataId(
    options?: StorageTypes.ITimestampBoundaries,
  ): Promise<StorageTypes.IEntriesWithLastTimestamp> {
    if (!this.isInitialized) {
      throw new Error('Ethereum storage must be initialized');
    }
    this.logger.info('Fetching dataIds from Ethereum', ['ethereum']);
    const {
      ethereumEntries,
      lastTimestamp,
    } = await this.smartContractManager.getEntriesFromEthereum(options);

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
      this.ipfsManager,
      this.ignoredDataIds,
      this.logger,
      this.maxConcurrency,
    );

    const ids = entries.map(entry => entry.id) || [];
    // Pin data asynchronously
    // tslint:disable-next-line:no-floating-promises
    this.pinDataToIPFS(ids);

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
   * Verify the ipfs node (connectivity and network)
   * Check if the node is reachable and if the list of bootstrap nodes is correct
   *
   * @returns nothing but throw if the ipfs node is not reachable or in the wrong network
   */
  private async checkIpfsNode(): Promise<void> {
    // check ipfs connection - will throw in case of error
    this.logger.info('Checking ipfs connection', ['ipfs', 'sanity']);
    try {
      await this.ipfsManager.getIpfsNodeId();
    } catch (error) {
      throw Error(`IPFS node is not accessible or corrupted: ${error}`);
    }

    // check if the ipfs node is in the request network private network - will throw in case of error
    this.logger.info('Checking ipfs network', ['ipfs', 'sanity']);
    try {
      const bootstrapList = await this.ipfsManager.getBootstrapList();

      const bootstrapNodeFoundCount: number = getIpfsExpectedBootstrapNodes().filter(nodeExpected =>
        bootstrapList.includes(nodeExpected),
      ).length;

      if (bootstrapNodeFoundCount !== getIpfsExpectedBootstrapNodes().length) {
        throw Error(
          `The list of bootstrap node in the ipfs config don't match the expected bootstrap nodes`,
        );
      }
    } catch (error) {
      throw Error(`IPFS node bootstrap node check failed: ${error}`);
    }
  }
}
