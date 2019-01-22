import { Storage as StorageTypes } from '@requestnetwork/types';
import * as Bluebird from 'bluebird';
import BadDataInSmartContractError from './bad-data-in-smart-contract-error';
import IpfsManager from './ipfs-manager';
import SmartContractManager from './smart-contract-manager';

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
   * Constructor
   * @param ipfsGatewayConnection Information structure to connect to the ipfs gateway
   * @param web3Connection Information structure to connect to the Ethereum network
   */
  public constructor(
    ipfsGatewayConnection?: StorageTypes.IIpfsGatewayConnection,
    web3Connection?: StorageTypes.IWeb3Connection,
  ) {
    this.ipfsManager = new IpfsManager(ipfsGatewayConnection);
    this.smartContractManager = new SmartContractManager(web3Connection);
  }

  /**
   * Update gateway connection information and connect to the new gateway
   * Missing value are filled with default config value
   * @param ipfsConnection Information structure to connect to the ipfs gateway
   */
  public updateIpfsGateway(ipfsGatewayConnection: StorageTypes.IIpfsGatewayConnection): void {
    this.ipfsManager = new IpfsManager(ipfsGatewayConnection);
  }

  /**
   * Update Ethereum network connection information and reconnect
   * Missing value are filled with default config value
   * @param web3Connection Information structure to connect to the Ethereum network
   */
  public updateEthereumNetwork(web3Connection: StorageTypes.IWeb3Connection): void {
    this.smartContractManager = new SmartContractManager(web3Connection);
  }

  /**
   * Append content into the storage: add the content to ipfs and the hash on Ethereum
   * @param content Content to add into the storage
   * @returns Promise resolving id used to retrieve the content
   */
  public async append(content: string): Promise<StorageTypes.IRequestStorageOneDataIdAndMeta> {
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
        storageType: StorageTypes.StorageSystemType.ETHEREUM_IPFS,
      },
      result: { dataId },
    };
  }

  /**
   * Read content from the storage
   * @param Id Id used to retrieve content
   * @returns Promise resolving content from id
   */
  public async read(id: string): Promise<StorageTypes.IRequestStorageOneContentAndMeta> {
    if (!id) {
      throw Error('No id provided');
    }

    // get meta data from ethereum
    let ethereumMetadata;
    try {
      ethereumMetadata = await this.smartContractManager.getMetaFromEthereum(id);
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
        storageType: StorageTypes.StorageSystemType.ETHEREUM_IPFS,
      },
      result: { content },
    };
  }

  /**
   * Get all data stored on the storage
   * @returns Promise resolving stored data
   */
  public async getAllData(): Promise<StorageTypes.IRequestStorageGetAllDataReturn> {
    const allDataIds = await this.getAllDataId();

    // Read content for each id
    const dataPromises = allDataIds.result.dataIds.map(
      async (id: string): Promise<StorageTypes.IRequestStorageOneContentAndMeta> => {
        return this.read(id);
      },
    );

    // Get value of all promises
    const allContentsAndMeta = await Promise.all(dataPromises);
    const metaData = allContentsAndMeta.map(obj => obj.meta);
    const data = allContentsAndMeta.map(obj => obj.result.content);

    return {
      meta: {
        metaData,
      },
      result: { data },
    };
  }

  /**
   * Get all id from data stored on the storage
   * @returns Promise resolving id of stored data
   */
  public async getAllDataId(): Promise<StorageTypes.IRequestStorageGetAllDataIdReturn> {
    const hashAndSizePromises = await this.smartContractManager.getAllHashesAndSizesFromEthereum();

    // Parse hashes and sizes
    // Reject on error when parsing the hash on ipfs
    // or when the size doesn't correspond to the size of the content stored on ipfs
    const parsedDataIdAndMetaPromises = hashAndSizePromises.map(
      async (
        hashAndSizePromise: StorageTypes.IRequestStorageGetAllHashesAndSizes,
      ): Promise<StorageTypes.IRequestStorageOneDataIdAndMeta> => {
        const hashAndSize = await hashAndSizePromise;

        if (typeof hashAndSize.hash === 'undefined' || typeof hashAndSize.size === 'undefined') {
          // The event log is incorrect
          throw Error('The event log has no hash or size');
        }

        // Get content from ipfs and verify provided size is correct
        let hashContentSize;
        try {
          hashContentSize = await this.ipfsManager.getContentLength(hashAndSize.hash);
        } catch (error) {
          throw new BadDataInSmartContractError(`IPFS getContentLength error: ${error}`);
        }
        if (hashContentSize !== hashAndSize.size) {
          throw new BadDataInSmartContractError(
            'The size of the content is not the size stored on ethereum',
          );
        }

        // get meta data from ethereum
        let ethereumMetadata;
        try {
          ethereumMetadata = await this.smartContractManager.getMetaFromEthereum(hashAndSize.hash);
        } catch (error) {
          throw Error(`Ethereum meta read request error: ${error}`);
        }

        return {
          meta: {
            ethereum: ethereumMetadata,
            ipfs: { size: hashContentSize },
            storageType: StorageTypes.StorageSystemType.ETHEREUM_IPFS,
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
    dataIdAndMetaPromises: Array<Promise<StorageTypes.IRequestStorageOneDataIdAndMeta>>,
  ): Promise<StorageTypes.IRequestStorageOneDataIdAndMeta[]> {
    // Convert the promises into bluebird promises
    // to be able to inspect the status of the promise with reflect
    const dataIdAndMetaInspections: any = Bluebird.all(
      dataIdAndMetaPromises.map(
        (dataIdAndMetaPromise: Promise<StorageTypes.IRequestStorageOneDataIdAndMeta>) =>
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
        throw Error(`getAllDataId error: ${inspection.reason()}`);
      })
      .map((inspection: any) => inspection.value());

    return filteredDataIdAndMeta;
  }
}
