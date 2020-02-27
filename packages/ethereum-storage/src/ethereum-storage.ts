import { LogTypes, StorageTypes } from '@requestnetwork/types';
import Utils from '@requestnetwork/utils';
import * as Bluebird from 'bluebird';
import { EventEmitter } from 'events';
import {
  getIpfsExpectedBootstrapNodes,
  getMaxConcurrency,
  getMaxIpfsReadRetry,
  getPinRequestConfig,
} from './config';

import EthereumMetadataCache from './ethereum-metadata-cache';
import IpfsConnectionError from './ipfs-connection-error';
import IpfsManager from './ipfs-manager';
import SmartContractManager from './smart-contract-manager';

import * as Keyv from 'keyv';

// rate of the size of the Header of a ipfs file regarding its content size
// used to estimate the size of a ipfs file from the content size
const SAFE_RATE_HEADER_SIZE: number = 0.3;
// max ipfs header size
const SAFE_MAX_HEADER_SIZE: number = 500;

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

  /**
   * Maximum number of concurrent calls
   */
  public maxConcurrency: number;

  /**
   * Number of times we retry to read hashes on IPFS
   * Left public for testing purpose
   */
  public maxIpfsReadRetry: number = getMaxIpfsReadRetry();

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

    const entries = await this.EthereumEntriesToEntries(ethereumEntries);

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
   * Verify the hashes are present on IPFS for the corresponding ethereum entry
   * Filtered incorrect hashes
   * @param ethereumEntries Ethereum entries from the smart contract
   * @returns Filtered list of dataId with metadata
   */
  private async EthereumEntriesToEntries(
    ethereumEntries: StorageTypes.IEthereumEntry[],
  ): Promise<StorageTypes.IEntry[]> {
    const totalCount: number = ethereumEntries.length;
    let successCount: number = 0;
    let successCountOnFirstTry: number = 0;
    let ipfsConnectionErrorCount: number = 0;
    let wrongFeesCount: number = 0;
    let incorrectFileCount: number = 0;

    // Contains results from readHashOnIPFS function
    // We store hashAndSize in this array in order to know which hashes have not been found on IPFS
    let entriesAndEthereumEntriesToRetry: Array<{
      entry: StorageTypes.IEntry | null;
      ethereumEntryToRetry: StorageTypes.IEthereumEntry | null;
    }>;

    // Contains hashes we retry to read on IPFS
    let ethereumEntriesToRetry: StorageTypes.IEthereumEntry[] = [];

    // Final array of dataIds and meta
    const entries: StorageTypes.IEntry[] = [];

    // Try to read the hashes on IPFS
    // The operation is done at least once and retried depending on the readOnIPFSRetry config
    for (let tryIndex = 0; tryIndex < 1 + this.maxIpfsReadRetry; tryIndex++) {
      // Reset for each retry
      ipfsConnectionErrorCount = 0;

      if (tryIndex > 0) {
        this.logger.debug(`Retrying to read hashes on IPFS`, ['ipfs']);
      }

      entriesAndEthereumEntriesToRetry = await Bluebird.map(
        ethereumEntries,
        // Read hash on IPFS and retrieve content corresponding to the hash
        // Reject on error when no file is found on IPFS
        // or when the declared size doesn't correspond to the size of the content stored on ipfs
        async (hashAndSize: StorageTypes.IEthereumEntry, currentIndex: number) => {
          // Check if the event log is incorrect
          if (
            typeof hashAndSize.hash === 'undefined' ||
            typeof hashAndSize.feesParameters === 'undefined'
          ) {
            throw Error('The event log has no hash or feesParameters');
          }
          if (typeof hashAndSize.meta === 'undefined') {
            throw Error('The event log has no metadata');
          }

          // Get content from ipfs and verify provided size is correct
          let ipfsObject;

          const startTime = Date.now();

          // To limit the read response size, calculate a reasonable margin for the IPFS headers compared to the size stored on ethereum
          const ipfsHeaderMargin = Math.max(
            hashAndSize.feesParameters.contentSize * SAFE_RATE_HEADER_SIZE,
            SAFE_MAX_HEADER_SIZE,
          );

          try {
            // Send ipfs request
            ipfsObject = await this.ipfsManager.read(
              hashAndSize.hash,
              Number(hashAndSize.feesParameters.contentSize) + ipfsHeaderMargin,
            );

            this.logger.debug(
              `[${successCount + currentIndex + 1}/${totalCount}] read ${
                hashAndSize.hash
              }, try; ${tryIndex + 1}. Took ${Date.now() - startTime} ms`,
              ['ipfs'],
            );
          } catch (error) {
            const errorMessage = error.message || error;

            // Check the type of the error
            if (error instanceof IpfsConnectionError) {
              this.logger.info(`IPFS connection error when trying to fetch: ${hashAndSize.hash}`, [
                'ipfs',
              ]);
              ipfsConnectionErrorCount++;
              this.logger.debug(`IPFS connection error : ${errorMessage}`, ['ipfs']);

              // An ipfs connection error occurred (for example a timeout), therefore we would eventually retry to find the hash
              return { entry: null, ethereumEntryToRetry: hashAndSize };
            } else {
              this.logger.info(`Incorrect file for hash: ${hashAndSize.hash}`, ['ipfs']);
              incorrectFileCount++;
              this.logger.debug(`Incorrect file error: ${errorMessage}`, ['ipfs']);

              // No need to retry to find this hash
              return { entry: null, ethereumEntryToRetry: null };
            }
          }

          const contentSizeDeclared = hashAndSize.feesParameters.contentSize;

          // Check if the declared size is higher or equal to the size of the actual file
          // If the declared size is higher, it's not considered as a problem since it means the hash submitter has paid a bigger fee than he had to
          if (!ipfsObject || ipfsObject.ipfsSize > contentSizeDeclared) {
            this.logger.info(`Incorrect declared size for hash: ${hashAndSize.hash}`, ['ipfs']);
            wrongFeesCount++;

            // No need to retry to find this hash
            return { entry: null, ethereumEntryToRetry: null };
          }

          // Get meta data from ethereum
          const ethereumMetadata = hashAndSize.meta;

          const entry = {
            content: ipfsObject.content,
            id: hashAndSize.hash,
            meta: {
              ethereum: ethereumMetadata,
              ipfs: { size: ipfsObject.ipfsSize },
              state: StorageTypes.ContentState.CONFIRMED,
              storageType: StorageTypes.StorageSystemType.ETHEREUM_IPFS,
              timestamp: ethereumMetadata.blockTimestamp,
            },
          };
          return { entry, ethereumEntryToRetry: null };
        },
        {
          concurrency: this.maxConcurrency,
        },
      );

      // Store found hashes in entries
      // The hashes to retry to read are the hashes where readHashOnIPFS returned null
      entriesAndEthereumEntriesToRetry.forEach(({ entry, ethereumEntryToRetry }) => {
        if (entry) {
          entries.push(entry);
        } else if (ethereumEntryToRetry) {
          ethereumEntriesToRetry.push(ethereumEntryToRetry);
        }
      });

      // Put the remaining hashes to retrieved in the queue for the next retry
      ethereumEntries = ethereumEntriesToRetry;
      ethereumEntriesToRetry = [];

      successCount = entries.length;

      this.logger.debug(`${successCount} retrieved dataIds after try ${tryIndex + 1}`, ['ipfs']);

      if (tryIndex === 0) {
        successCountOnFirstTry = successCount;
      }
    }

    this.logger.info(
      `getData on ${totalCount} events, ${successCount} retrieved (${successCount -
        successCountOnFirstTry} after retries), ${ipfsConnectionErrorCount} not found, ${incorrectFileCount} incorrect files, ${wrongFeesCount} with wrong fees`,
      ['metric', 'successfullyRetrieved'],
    );

    return entries;
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
