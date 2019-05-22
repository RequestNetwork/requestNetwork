import { Common as CommonTypes } from '@requestnetwork/types';
import { Storage as Types } from '@requestnetwork/types';
import * as Bluebird from 'bluebird';
import { getDefaultIpfsSwarmPeers, getMaxConcurrency } from './config';
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
   * Log level
   */
  private logLevel: CommonTypes.LogLevel;

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
      logLevel,
      maxConcurrency,
      maxRetries,
      retryDelay,
    }: {
      getLastBlockNumberDelay?: number;
      logLevel: CommonTypes.LogLevel;
      maxConcurrency?: number;
      maxRetries?: number;
      retryDelay?: number;
    } = {
      logLevel: CommonTypes.LogLevel.ERROR,
    },
  ) {
    this.maxConcurrency = maxConcurrency || getMaxConcurrency();
    this.logLevel = logLevel;
    this.ipfsManager = new IpfsManager(ipfsGatewayConnection);
    this.smartContractManager = new SmartContractManager(web3Connection, {
      getLastBlockNumberDelay,
      logLevel,
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
    try {
      await this.smartContractManager.checkEthereumNodeConnection();
    } catch (error) {
      throw Error(`Ethereum node is not accessible: ${error}`);
    }

    // check ipfs connection - will throw in case of error
    try {
      await this.ipfsManager.verifyRepository();
    } catch (error) {
      throw Error(`IPFS node is not accessible or corrupted: ${error}`);
    }

    // add request IPFS swarm peers (allows faster request data access)
    const swarmPeers = getDefaultIpfsSwarmPeers();
    await Promise.all(
      swarmPeers.map(
        async (swarmPeer: string): Promise<void> => {
          try {
            const swarmPeersAddress = await this.ipfsManager.connectSwarmPeer(swarmPeer);
            if (this.logLevel === CommonTypes.LogLevel.DEBUG) {
              // tslint:disable:no-console
              console.info(`IPFS swarm peer added: (${swarmPeersAddress})`);
            }
          } catch (error) {
            // tslint:disable:no-console
            console.warn(`Warning: IPFS cannot add the swarm peer (${swarmPeer}): ${error}`);
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
    if (this.logLevel === CommonTypes.LogLevel.DEBUG) {
      // tslint:disable:no-console
      console.info('Fetching dataIds from Ethereum');
    }
    const hashesAndSizes = await this.smartContractManager.getHashesAndSizesFromEthereum(options);

    if (this.logLevel === CommonTypes.LogLevel.DEBUG) {
      // tslint:disable:no-console
      console.info('Fetching data size from IPFS and checking correctness');
    }
    const filteredDataIdAndMeta = await this.hashesAndSizesToFilteredDataIdAndMeta(hashesAndSizes);

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
          if (this.logLevel === CommonTypes.LogLevel.DEBUG) {
            // tslint:disable:no-console
            console.info(
              `[${currentIndex}/${totalCount}] getContentLength ${
                hashAndSize.hash
              }. Took ${Date.now() - startTime} ms`,
            );
          }
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
          if (this.logLevel === CommonTypes.LogLevel.DEBUG) {
            console.error(`Ignored invalid hash: ${hashAndSize.hash}`);
            if (badDataInSmartContractError) {
              console.error(badDataInSmartContractError);
            } else {
              console.info('The size of the content is not the size stored on ethereum');
            }
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
