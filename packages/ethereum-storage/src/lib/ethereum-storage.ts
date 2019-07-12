import { LogTypes, StorageTypes } from '@requestnetwork/types';
import Utils from '@requestnetwork/utils';
import * as Bluebird from 'bluebird';
import { getMaxConcurrency, getPinRequestConfig } from './config';
import EthereumMetadataCache from './ethereum-metadata-cache';
import IpfsManager from './ipfs-manager';
import SmartContractManager from './smart-contract-manager';

import * as Keyv from 'keyv';

// rate of the size of the Header of a ipfs file regarding its content size
// used to estimate the size of a ipfs file from the content size
const SAFE_RATE_HEADER_SIZE: number = 0.3;
// max ipfs header size
const SAFE_MAX_HEADER_SIZE: number = 500;

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
      await this.smartContractManager.checkEthereumNodeConnection();
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

    // check ipfs connection - will throw in case of error
    this.logger.info('Checking ipfs connection', ['ipfs', 'sanity']);
    try {
      await this.ipfsManager.getIpfsNodeId();
    } catch (error) {
      throw Error(`IPFS node is not accessible or corrupted: ${error}`);
    }

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

    // check ipfs connection - will throw in case of error
    try {
      await this.ipfsManager.getIpfsNodeId();
    } catch (error) {
      throw Error(`IPFS node is not accessible or corrupted: ${error}`);
    }
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
      await this.smartContractManager.checkEthereumNodeConnection();
    } catch (error) {
      throw Error(`Ethereum node is not accessible: ${error}`);
    }
  }

  /**
   * Append content into the storage: add the content to ipfs and the hash on Ethereum
   * @param content Content to add into the storage
   * @returns Promise resolving id used to retrieve the content
   */
  public async append(content: string): Promise<StorageTypes.IOneDataIdAndMeta> {
    if (!this.isInitialized) {
      throw new Error('Ethereum storage must be initialized');
    }

    if (!content) {
      throw Error('No content provided');
    }

    // Add content to ipfs
    let dataId;
    try {
      dataId = await this.ipfsManager.add(content);
    } catch (error) {
      throw Error(`Ipfs add request error: ${error}`);
    }

    // Get content length from ipfs
    let contentSize;
    try {
      contentSize = await this.ipfsManager.getContentLength(dataId);
    } catch (error) {
      throw Error(`Ipfs get length request error: ${error}`);
    }

    const feesParameters: StorageTypes.IFeesParameters = { contentSize };

    // Add content hash to ethereum
    let ethereumMetadata;
    try {
      ethereumMetadata = await this.smartContractManager.addHashAndSizeToEthereum(
        dataId,
        feesParameters,
      );
    } catch (error) {
      throw Error(`Smart contract error: ${error}`);
    }

    // Save the metadata of the new dataId into the Ethereum metadata cache
    await this.ethereumMetadataCache.saveDataIdMeta(dataId, ethereumMetadata);

    return {
      meta: {
        ethereum: ethereumMetadata,
        ipfs: { size: contentSize },
        storageType: StorageTypes.StorageSystemType.ETHEREUM_IPFS,
        timestamp: ethereumMetadata.blockTimestamp,
      },
      result: { dataId },
    };
  }

  /**
   * Read content from the storage
   * @param Id Id used to retrieve content
   * @returns Promise resolving content from id
   */
  public async read(id: string): Promise<StorageTypes.IOneContentAndMeta> {
    if (!this.isInitialized) {
      throw new Error('Ethereum storage must be initialized');
    }
    if (!id) {
      throw Error('No id provided');
    }

    // Get Ethereum metadata
    let ethereumMetadata;
    try {
      ethereumMetadata = await this.ethereumMetadataCache.getDataIdMeta(id);
    } catch (error) {
      throw Error(`Ethereum meta read request error: ${error}`);
    }

    // Send ipfs request
    let ipfsObject;
    try {
      ipfsObject = await this.ipfsManager.read(id);
    } catch (error) {
      throw Error(`Ipfs read request error: ${error}`);
    }

    return {
      meta: {
        ethereum: ethereumMetadata,
        ipfs: { size: ipfsObject.ipfsSize },
        storageType: StorageTypes.StorageSystemType.ETHEREUM_IPFS,
        timestamp: ethereumMetadata.blockTimestamp,
      },
      result: { content: ipfsObject.content },
    };
  }

  /**
   * Read a list of content from the storage
   *
   * @param dataIds A list of dataIds used to retrieve the content
   * @returns Promise resolving the list of contents
   */
  public async readMany(dataIds: string[]): Promise<StorageTypes.IOneContentAndMeta[]> {
    const totalCount = dataIds.length;
    // Concurrently get all the content from the id's in the parameters
    return Bluebird.map(
      dataIds,
      async (dataId, currentIndex) => {
        const startTime = Date.now();
        const data = await this.read(dataId);
        this.logger.debug(
          `[${currentIndex}/${totalCount}] read ${dataId}. Took ${Date.now() - startTime} ms`,
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
  ): Promise<StorageTypes.IGetDataIdContentAndMeta> {
    const contentDataIdAndMeta = await this.getContentAndDataId(options);

    return contentDataIdAndMeta;
  }

  /**
   * Get all id from data stored on the storage
   *
   * @param options timestamp boundaries for the data id retrieval
   * @returns Promise resolving id of stored data
   */
  public async getDataId(
    options?: StorageTypes.ITimestampBoundaries,
  ): Promise<StorageTypes.IGetDataIdReturn> {
    const contentDataIdAndMeta = await this.getContentAndDataId(options);

    // copy before deleting the key to avoid side effect
    const contentDataIdAndMetaCopied = Utils.deepCopy(contentDataIdAndMeta);

    // only keep the dataIds and cast in the right format
    delete contentDataIdAndMetaCopied.result.data;

    return contentDataIdAndMetaCopied as StorageTypes.IGetDataIdReturn;
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
  ): Promise<StorageTypes.IGetDataIdContentAndMeta> {
    if (!this.isInitialized) {
      throw new Error('Ethereum storage must be initialized');
    }
    this.logger.info('Fetching dataIds from Ethereum', ['ethereum']);
    const hashesAndSizes = await this.smartContractManager.getHashesAndSizesFromEthereum(options);

    this.logger.debug('Fetching data from IPFS and checking correctness', ['ipfs']);

    const contentDataIdAndMeta = await this.hashesAndSizesToFilteredDataIdContentAndMeta(
      hashesAndSizes,
    );

    const dataIds = contentDataIdAndMeta.result.dataIds || [];
    // Pin data asynchronously
    // tslint:disable-next-line:no-floating-promises
    this.pinDataToIPFS(dataIds);

    // Save existing ethereum metadata to the ethereum metadata cache
    for (let i = 0; i < dataIds.length; i++) {
      const ethereumMetadata = contentDataIdAndMeta.meta.metaData[i].ethereum;
      if (ethereumMetadata) {
        // PROT-504: The saving of dataId's metadata should be encapsulated when retrieving dataId inside smart contract (getPastEvents)
        await this.ethereumMetadataCache.saveDataIdMeta(dataIds[i], ethereumMetadata);
      }
    }

    return contentDataIdAndMeta;
  }

  /**
   * Verify the hashes are present on IPFS with the corresponding size and add metadata
   * Filtered incorrect hashes
   * @param hashesAndSizes Promises of hash and size from the smart contract
   * @returns Filtered list of dataId with metadata
   */
  private async hashesAndSizesToFilteredDataIdContentAndMeta(
    hashesAndSizes: StorageTypes.IGetAllHashesAndSizes[],
  ): Promise<StorageTypes.IGetDataIdContentAndMeta> {
    const totalCount = hashesAndSizes.length;
    let succeedCount = 0;
    let timeoutCount = 0;
    let wrongFeesCount = 0;

    // Parse hashes and sizes
    // Reject on error when parsing the hash on ipfs
    // or when the size doesn't correspond to the size of the content stored on ipfs
    const parsedDataIdAndMeta = await Bluebird.map(
      hashesAndSizes,
      async (
        hashAndSizePromise: StorageTypes.IGetAllHashesAndSizes,
        currentIndex: number,
      ): Promise<StorageTypes.IOneDataIdContentAndMeta | null> => {
        const hashAndSize = await hashAndSizePromise;
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
        let badDataInSmartContractError;
        let ipfsObject;
        try {
          const startTime = Date.now();

          // To limit the read response size, calculate a reasonable margin for the IPFS headers compared to the size stored on ethereum
          const ipfsHeaderMargin = Math.max(
            hashAndSize.feesParameters.contentSize * SAFE_RATE_HEADER_SIZE,
            SAFE_MAX_HEADER_SIZE,
          );

          // Send ipfs request
          ipfsObject = await this.ipfsManager.read(
            hashAndSize.hash,
            Number(hashAndSize.feesParameters.contentSize) + ipfsHeaderMargin,
          );

          this.logger.debug(
            `[${currentIndex}/${totalCount}] read ${hashAndSize.hash}. Took ${Date.now() -
              startTime} ms`,
            ['ipfs'],
          );
        } catch (error) {
          badDataInSmartContractError = `IPFS read: ${error.message || error} ${hashAndSize.hash}`;
        }

        const contentSizeDeclared = hashAndSize.feesParameters.contentSize;

        /* Anybody can add any data into the storage smart contract
         * Therefore we can find in the storage smart contract:
         * - Hash that doesn't match to any file in IPFS
         * - Size value that doesn't match to the real size of the file stored on IPFS
         * In these cases, we simply ignore the values instead of throwing an error
         */
        if (
          badDataInSmartContractError ||
          !ipfsObject ||
          ipfsObject.ipfsSize > contentSizeDeclared
        ) {
          this.logger.info(`Ignoring missing hash: ${hashAndSize.hash}`, ['ipfs']);
          if (badDataInSmartContractError) {
            timeoutCount++;
            this.logger.debug(badDataInSmartContractError, ['ipfs']);
          } else {
            wrongFeesCount++;
            this.logger.debug('The size of the content is not the size stored on ethereum', [
              'ipfs',
            ]);
          }
          return null;
        }

        succeedCount++;

        // Get meta data from ethereum
        const ethereumMetadata = hashAndSize.meta;

        return {
          meta: {
            ethereum: ethereumMetadata,
            ipfs: { size: ipfsObject.ipfsSize },
            storageType: StorageTypes.StorageSystemType.ETHEREUM_IPFS,
            timestamp: ethereumMetadata.blockTimestamp,
          },
          result: {
            data: ipfsObject.content,
            dataId: hashAndSize.hash,
          },
        };
      },
      {
        concurrency: this.maxConcurrency,
      },
    );

    this.logger.info(
      `getData on ${totalCount} events, ${succeedCount} retrieved, ${timeoutCount} not found, ${wrongFeesCount} with wrong fees`,
      ['metric', 'successfullyRetrieved'],
    );

    // Filter the rejected parsedDataIdAndMeta
    const arrayOfDataIdAndMeta = parsedDataIdAndMeta.filter(
      dataIdAndMeta => dataIdAndMeta,
    ) as StorageTypes.IOneDataIdContentAndMeta[];

    // Create the array of data ids
    const dataIds = arrayOfDataIdAndMeta.map(dataIdAndMeta => dataIdAndMeta.result.dataId);
    // Create the array of data content
    const data = arrayOfDataIdAndMeta.map(dataIdAndMeta => dataIdAndMeta.result.data);
    // Create the array of metadata
    const metaData = arrayOfDataIdAndMeta.map(dataIdAndMeta => dataIdAndMeta.meta);

    return {
      meta: {
        metaData,
      },
      result: { dataIds, data },
    };
  }
}
