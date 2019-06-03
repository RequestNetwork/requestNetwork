import { Log as LogTypes, Storage as Types } from '@requestnetwork/types';
import Utils from '@requestnetwork/utils';
import * as Bluebird from 'bluebird';
import { getDefaultIpfsSwarmPeers, getMaxConcurrency, getPinRequestConfig } from './config';
import EthereumMetadataCache from './ethereum-metadata-cache';
import IpfsManager from './ipfs-manager';
import SmartContractManager from './smart-contract-manager';

/**
 * EthereumStorage
 * @notice Manages storage layer of the Request Network Protocol v2
 */
export default class EthereumStorage implements Types.IStorage {
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
   */
  public constructor(
    ipfsGatewayConnection?: Types.IIpfsGatewayConnection,
    web3Connection?: Types.IWeb3Connection,
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
    this.ethereumMetadataCache = new EthereumMetadataCache(this.smartContractManager);
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
      await this.ipfsManager.verifyRepository();
    } catch (error) {
      throw Error(`IPFS node is not accessible or corrupted: ${error}`);
    }

    // add request IPFS swarm peers (allows faster request data access)
    const swarmPeers = getDefaultIpfsSwarmPeers();
    this.logger.info('Adding IPFS swarm peers', ['ipfs', 'sanity']);

    // Log if swarm peers list is empty
    if (!swarmPeers.length) {
      this.logger.warn(`IPFS swarm peers list is empty`, ['ipfs']);
    }

    await Promise.all(
      swarmPeers.map(
        async (swarmPeer: string): Promise<void> => {
          try {
            const swarmPeersAddress = await this.ipfsManager.connectSwarmPeer(swarmPeer);
            this.logger.debug(`IPFS swarm peer added: (${swarmPeersAddress})`, ['ipfs']);
          } catch (error) {
            this.logger.warn(`IPFS cannot add the swarm peer (${swarmPeer}): ${error}`, ['ipfs']);
          }
        },
      ),
    );

    this.isInitialized = true;
  }

  /**
   * Update gateway connection information and connect to the new gateway
   * Missing value are filled with default config value
   * @param ipfsConnection Information structure to connect to the ipfs gateway
   */
  public async updateIpfsGateway(
    ipfsGatewayConnection: Types.IIpfsGatewayConnection,
  ): Promise<void> {
    this.ipfsManager = new IpfsManager(ipfsGatewayConnection);

    // check ipfs connection - will throw in case of error
    try {
      await this.ipfsManager.verifyRepository();
    } catch (error) {
      throw Error(`IPFS node is not accessible or corrupted: ${error}`);
    }
  }

  /**
   * Update Ethereum network connection information and reconnect
   * Missing value are filled with default config value
   * @param web3Connection Information structure to connect to the Ethereum network
   */
  public async updateEthereumNetwork(web3Connection: Types.IWeb3Connection): Promise<void> {
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
  public async append(content: string): Promise<Types.IOneDataIdAndMeta> {
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

    const feesParameters: Types.IFeesParameters = { contentSize };

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
    this.ethereumMetadataCache.saveDataIdMeta(dataId, ethereumMetadata);

    return {
      meta: {
        ethereum: ethereumMetadata,
        ipfs: { size: contentSize },
        storageType: Types.StorageSystemType.ETHEREUM_IPFS,
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
  public async read(id: string): Promise<Types.IOneContentAndMeta> {
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
    let content;
    try {
      content = await this.ipfsManager.read(id);
    } catch (error) {
      throw Error(`Ipfs read request error: ${error}`);
    }

    // Get content length from ipfs
    let contentLength;
    try {
      contentLength = await this.ipfsManager.getContentLength(id);
    } catch (error) {
      throw Error(`Ipfs get length request error: ${error}`);
    }

    return {
      meta: {
        ethereum: ethereumMetadata,
        ipfs: { size: contentLength },
        storageType: Types.StorageSystemType.ETHEREUM_IPFS,
        timestamp: ethereumMetadata.blockTimestamp,
      },
      result: { content },
    };
  }

  /**
   * Read a list of content from the storage
   *
   * @param dataIds A list of dataIds used to retrieve the content
   * @returns Promise resolving the list of contents
   */
  public async readMany(dataIds: string[]): Promise<Types.IOneContentAndMeta[]> {
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
  public async getData(options?: Types.ITimestampBoundaries): Promise<Types.IGetDataReturn> {
    if (!this.isInitialized) {
      throw new Error('Ethereum storage must be initialized');
    }
    const dataIds = await this.getDataId(options);

    // Read content for each id
    const dataPromises = dataIds.result.dataIds.map(
      async (id: string): Promise<Types.IOneContentAndMeta> => {
        return this.read(id);
      },
    );

    // Get value of all promises
    const contentsAndMeta = await Promise.all(dataPromises);
    const metaData = contentsAndMeta.map(obj => obj.meta);
    const data = contentsAndMeta.map(obj => obj.result.content);

    return {
      meta: {
        metaData,
      },
      result: { data },
    };
  }

  /**
   * Get all id from data stored on the storage
   *
   * @param options timestamp boundaries for the data id retrieval
   * @returns Promise resolving id of stored data
   */
  public async getDataId(options?: Types.ITimestampBoundaries): Promise<Types.IGetDataIdReturn> {
    if (!this.isInitialized) {
      throw new Error('Ethereum storage must be initialized');
    }
    this.logger.info('Fetching dataIds from Ethereum', ['ethereum']);
    const hashesAndSizes = await this.smartContractManager.getHashesAndSizesFromEthereum(options);

    this.logger.debug('Fetching data size from IPFS and checking correctness', ['ipfs']);

    const filteredDataIdAndMeta = await this.hashesAndSizesToFilteredDataIdAndMeta(hashesAndSizes);

    // Pin data asynchronously
    // tslint:disable-next-line:no-floating-promises
    this.pinDataToIPFS(filteredDataIdAndMeta.result.dataIds);

    // Save existing ethereum metadata to the ethereum metadata cache
    for (let i = 0; i < filteredDataIdAndMeta.result.dataIds.length; i++) {
      const ethereumMetadata = filteredDataIdAndMeta.meta.metaDataIds[i].ethereum;
      if (ethereumMetadata) {
        // PROT-504: The saving of dataId's metadata should be encapsulated when retrieving dataId inside smart contract (getPastEvents)
        this.ethereumMetadataCache.saveDataIdMeta(
          filteredDataIdAndMeta.result.dataIds[i],
          ethereumMetadata,
        );
      }
    }

    return filteredDataIdAndMeta;
  }

  /**
   * Pin an array of IPFS hashes
   *
   * @param hashes An array of IPFS hashes to pin
   */
  public async pinDataToIPFS(
    hashes: string[],
    { delayBetweenCalls, maxSize, timeout }: Types.IPinRequestConfiguration = getPinRequestConfig(),
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
   * Verify the hashes are present on IPFS with the corresponding size and add metadata
   * Filtered incorrect hashes
   * @param hashesAndSizes Promises of hash and size from the smart contract
   * @returns Filtered list of dataId with metadata
   */
  private async hashesAndSizesToFilteredDataIdAndMeta(
    hashesAndSizes: Types.IGetAllHashesAndSizes[],
  ): Promise<Types.IGetDataIdReturn | Types.IGetNewDataIdReturn> {
    const totalCount = hashesAndSizes.length;

    // Parse hashes and sizes
    // Reject on error when parsing the hash on ipfs
    // or when the size doesn't correspond to the size of the content stored on ipfs
    const parsedDataIdAndMeta = await Bluebird.map(
      hashesAndSizes,
      async (
        hashAndSizePromise: Types.IGetAllHashesAndSizes,
        currentIndex: number,
      ): Promise<Types.IOneDataIdAndMeta | null> => {
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
        let hashContentSize;
        let badDataInSmartContractError;
        try {
          const startTime = Date.now();

          hashContentSize = await this.ipfsManager.getContentLength(hashAndSize.hash);
          this.logger.debug(
            `[${currentIndex}/${totalCount}] getContentLength ${
              hashAndSize.hash
            }. Took ${Date.now() - startTime} ms`,
            ['ipfs'],
          );
        } catch (error) {
          badDataInSmartContractError = `IPFS getContentLength: ${error.message || error} ${
            hashAndSize.hash
          }`;
        }

        const contentSizeDeclared = hashAndSize.feesParameters.contentSize;

        /* Anybody can add any data into the storage smart contract
         * Therefore we can find in the storage smart contract:
         * - Hash that doesn't match to any file in IPFS
         * - Size value that doesn't match to the real size of the file stored on IPFS
         * In these cases, we simply ignore the values instead of throwing an error
         */
        if (badDataInSmartContractError || hashContentSize !== contentSizeDeclared) {
          this.logger.info(`Ignoring missing hash: ${hashAndSize.hash}`, ['ipfs']);
          if (badDataInSmartContractError) {
            this.logger.debug(badDataInSmartContractError, ['ipfs']);
          } else {
            this.logger.debug('The size of the content is not the size stored on ethereum', [
              'ipfs',
            ]);
          }
          return null;
        }

        // Get meta data from ethereum
        const ethereumMetadata = hashAndSize.meta;

        return {
          meta: {
            ethereum: ethereumMetadata,
            ipfs: { size: hashContentSize },
            storageType: Types.StorageSystemType.ETHEREUM_IPFS,
            timestamp: ethereumMetadata.blockTimestamp,
          },
          result: {
            dataId: hashAndSize.hash,
          },
        };
      },
      {
        concurrency: this.maxConcurrency,
      },
    );

    // Filter the rejected parsedDataIdAndMeta
    const arrayOfDataIdAndMeta = parsedDataIdAndMeta.filter(
      dataIdAndMeta => dataIdAndMeta,
    ) as Types.IOneDataIdAndMeta[];

    // Create the array of data ids
    const dataIds = arrayOfDataIdAndMeta.map(dataIdAndMeta => dataIdAndMeta.result.dataId);
    // Create the array of metadata
    const metaDataIds = arrayOfDataIdAndMeta.map(dataIdAndMeta => dataIdAndMeta.meta);

    return {
      meta: {
        metaDataIds,
      },
      result: { dataIds },
    };
  }
}
