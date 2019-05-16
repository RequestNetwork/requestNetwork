import { Common as CommonTypes } from '@requestnetwork/types';
import { Storage as Types } from '@requestnetwork/types';
import * as Bluebird from 'bluebird';
import BadDataInSmartContractError from './bad-data-in-smart-contract-error';
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
   * Log level
   */
  private logLevel: CommonTypes.LogLevel;

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
      logLevel,
      getLastBlockNumberDelay,
    }: {
      logLevel: CommonTypes.LogLevel;
      getLastBlockNumberDelay?: number;
    } = {
      logLevel: CommonTypes.LogLevel.ERROR,
    },
  ) {
    this.logLevel = logLevel;
    this.ipfsManager = new IpfsManager(ipfsGatewayConnection);
    this.smartContractManager = new SmartContractManager(web3Connection, {
      getLastBlockNumberDelay,
      logLevel,
    });
    this.ethereumMetadataCache = new EthereumMetadataCache(this.smartContractManager);
  }

  /**
   * Update gateway connection information and connect to the new gateway
   * Missing value are filled with default config value
   * @param ipfsConnection Information structure to connect to the ipfs gateway
   */
  public updateIpfsGateway(ipfsGatewayConnection: Types.IIpfsGatewayConnection): void {
    this.ipfsManager = new IpfsManager(ipfsGatewayConnection);
  }

  /**
   * Update Ethereum network connection information and reconnect
   * Missing value are filled with default config value
   * @param web3Connection Information structure to connect to the Ethereum network
   */
  public updateEthereumNetwork(web3Connection: Types.IWeb3Connection): void {
    this.smartContractManager = new SmartContractManager(web3Connection);
  }

  /**
   * Append content into the storage: add the content to ipfs and the hash on Ethereum
   * @param content Content to add into the storage
   * @returns Promise resolving id used to retrieve the content
   */
  public async append(content: string): Promise<Types.IOneDataIdAndMeta> {
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
    let contentLength;
    try {
      contentLength = await this.ipfsManager.getContentLength(dataId);
    } catch (error) {
      throw Error(`Ipfs get length request error: ${error}`);
    }

    // Add content hash to ethereum
    let ethereumMetadata;
    try {
      ethereumMetadata = await this.smartContractManager.addHashAndSizeToEthereum(
        dataId,
        contentLength,
      );
    } catch (error) {
      throw Error(`Smart contract error: ${error}`);
    }

    return {
      meta: {
        ethereum: ethereumMetadata,
        ipfs: { size: contentLength },
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
    let currentIndex = 1;

    // Parse hashes and sizes
    // Reject on error when parsing the hash on ipfs
    // or when the size doesn't correspond to the size of the content stored on ipfs
    const parsedDataIdAndMetaPromises = hashesAndSizes.map(
      async (hashAndSizePromise: Types.IGetAllHashesAndSizes): Promise<Types.IOneDataIdAndMeta> => {
        const hashAndSize = await hashAndSizePromise;

        // Check if the event log is incorrect
        if (typeof hashAndSize.hash === 'undefined' || typeof hashAndSize.size === 'undefined') {
          throw Error('The event log has no hash or size');
        }
        if (typeof hashAndSize.meta === 'undefined') {
          throw Error('The event log has no metadata');
        }

        // Get content from ipfs and verify provided size is correct
        let hashContentSize;
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
          currentIndex++;
        } catch (error) {
          console.error(`IPFS getContentLength: ${error.message || error} ${hashAndSize.hash}`);
          throw new BadDataInSmartContractError(`IPFS getContentLength error: ${error}`);
        }
        if (hashContentSize !== hashAndSize.size) {
          throw new BadDataInSmartContractError(
            'The size of the content is not the size stored on ethereum',
          );
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
    );

    // Filter the rejected parsed promises
    let arrayOfDataIdAndMeta;
    try {
      arrayOfDataIdAndMeta = await this.filterDataIdAndMetaPromises(parsedDataIdAndMetaPromises);
    } catch (e) {
      throw e;
    }

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

  /**
   * Filter the parsed promises
   * Anybody can add any data into the storage smart contract
   * Therefore we can find in the storage smart contract:
   * - Hash that doesn't match to any file in IPFS
   * - Size value that doesn't match to the real size of the file stored on IPFS
   * In these cases, we simply ignore the values instead of throwing an error
   * For other errors, we throw an Error
   *
   * @param dataIdAndMetaPromises Promises containing data id and meta
   * @returns Filtered promises
   */
  private async filterDataIdAndMetaPromises(
    dataIdAndMetaPromises: Array<Promise<Types.IOneDataIdAndMeta>>,
  ): Promise<Types.IOneDataIdAndMeta[]> {
    // Convert the promises into bluebird promises
    // to be able to inspect the status of the promise with reflect
    const dataIdAndMetaInspections: any = Bluebird.all(
      dataIdAndMetaPromises.map((dataIdAndMetaPromise: Promise<Types.IOneDataIdAndMeta>) =>
        Bluebird.resolve(dataIdAndMetaPromise).reflect(),
      ),
    );

    const filteredDataIdAndMeta: any[] = await dataIdAndMetaInspections
      .filter((inspection: any) => {
        if (inspection.isFulfilled()) {
          // The parsing has been fulfilled
          return true;
        }
        if (inspection.reason() instanceof BadDataInSmartContractError) {
          // If the error concerns bad data in the smart contract:
          // Hash that doesn't correspond to any file in IPFS or
          // size value that doesn't correspond to the real size of the file stored on IPFS
          // We ignore the error
          return false;
        }
        throw Error(`getDataId error: ${inspection.reason()}`);
      })
      .map((inspection: any) => inspection.value());

    return filteredDataIdAndMeta;
  }
}
