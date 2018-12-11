import { Storage as StorageTypes } from '@requestnetwork/types';
import IpfsManager from './ipfs-manager';
import SmartContractManager from './smartcontract-manager';

/**
 * EthereumStorage
 * @notice Manages storage layer of the Request Network Protocol v2
 */
export class EthereumStorage implements StorageTypes.IStorage {
  private ipfsManager: IpfsManager;
  private smartContractManager: SmartContractManager;
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
   * Update gateway connection informations and connect to the new gateway
   * Missing value are filled with default config value
   * @param ipfsConnection Information structure to connect to the ipfs gateway
   */
  public updateIpfsGateway(
    ipfsGatewayConnection: StorageTypes.IIpfsGatewayConnection,
  ): void {
    this.ipfsManager = new IpfsManager(ipfsGatewayConnection);
  }

  /**
   * Update Ethereum network connection informations and reconnect
   * Missing value are filled with default config value
   * @param web3Connection Information structure to connect to the Ethereum network
   */
  public updateEthereumNetwork(
    web3Connection: StorageTypes.IWeb3Connection,
  ): void {
    this.smartContractManager = new SmartContractManager(web3Connection);
  }

  /**
   * Append content into the storage: add the content to ipfs and the hash on Ethereum
   * @param content Content to add into the storage
   * @returns Promise resolving id used to retrieve the content
   */
  public async append(content: string): Promise<string> {
    if (!content) {
      throw Error('Error: no content provided');
    }

    // Add content to ipfs
    let id;
    try {
      id = await this.ipfsManager.add(content);
    } catch (error) {
      throw Error(`Ipfs add request error: ${error}`);
    }

    // Get content length from ipfs
    let contentLength;
    try {
      contentLength = await this.ipfsManager.getContentLength(id);
    } catch (error) {
      throw Error(`Ipfs get length request error: ${error}`);
    }

    // Add content hash to ethereum
    try {
      await this.smartContractManager.addHashAndSizeToEthereum(
        id,
        contentLength,
      );
    } catch (error) {
      throw Error(`Smart contract error: ${error}`);
    }

    return id;
  }

  /**
   * Read content from the storage
   * @param Id Id used to retrieve content
   * @returns Promise resolving content from id
   */
  public async read(id: string): Promise<string> {
    if (!id) {
      throw Error('No id provided');
    }

    // Send ipfs request
    let content;
    try {
      content = await this.ipfsManager.read(id);
    } catch (error) {
      throw Error(`Ipfs read request error: ${error}`);
    }

    return content;
  }

  /**
   * Get all data stored on the storage
   * @returns Promise resolving stored data
   */
  public async getAllData(): Promise<string[]> {
    const ids = await this.getAllDataId();

    const dataPromises = ids.map(
      async (id: string): Promise<string> => {

        // Return empty string if id has not been retrieved
        // Should be removed after PROT-197
        if (!id) {
          return '';
        }

        const content = await this.read(id);
        return content;
      },
    );

    return Promise.all(dataPromises);
  }

  /**
   * Get all id from data stored on the storage
   * @returns Promise resolving id of stored data
   */
  public async getAllDataId(): Promise<string[]> {
    const hashAndSizePromises = await this.smartContractManager.getAllHashesAndSizesFromEthereum();

    // Filter hashes where size doesn't correspond to the size stored on ipfs
    const filteredHashes = hashAndSizePromises.map(
      async (hashAndSizePromise: any): Promise<string> => {
        const hashAndSize = await hashAndSizePromise;

        if (!hashAndSize.hash || !hashAndSize.size) {
          // The event log is incorrect
          // PROT-197
          // throw Error('The event log has no hash or size');
          return '';
        }

        // Get content from ipfs and verify provided size is correct
        let hashContentSize;
        try {
          hashContentSize = await this.ipfsManager.getContentLength(
            hashAndSize.hash,
          );
        } catch (error) {
          // PROT-197
          // throw Error(`IPFS getContentLength: ${error}`);
          return '';
        }
        if (hashContentSize !== parseInt(hashAndSize.size, 10)) {
          // PROT-197
          // throw Error(
          //   'The size of the content is not the size stored on ethereum',
          // );
          return '';
        }

        return hashAndSize.hash;
      },
    );

    return Promise.all(filteredHashes);
  }
}
