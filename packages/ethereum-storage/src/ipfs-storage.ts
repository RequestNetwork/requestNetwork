import { LogTypes, StorageTypes } from '@requestnetwork/types';
import { SimpleLogger } from '@requestnetwork/utils';

import { getIpfsExpectedBootstrapNodes } from './config';
import IpfsManager, { IpfsOptions } from './ipfs-manager';

export class IpfsStorage implements StorageTypes.IIpfsStorage {
  private ipfsManager: IpfsManager;
  private logger: LogTypes.ILogger;

  constructor(options: IpfsOptions = {}) {
    this.ipfsManager = new IpfsManager(options);
    this.logger = options.logger || new SimpleLogger();
  }

  public async initialize(): Promise<void> {
    await this.checkIpfsNode();
  }

  /**
   * Add the content to ipfs
   * To be used only in case of persisting the hash on ethereum outside the storage
   *
   * @param content Content to add into the storage
   * @returns Promise resolving id used to retrieve the content
   */
  public async ipfsAdd(data: string): Promise<StorageTypes.IIpfsMeta> {
    if (!data) {
      throw Error('No content provided');
    }

    // Add content to IPFS and get the hash back
    let ipfsHash: string;
    try {
      ipfsHash = await this.ipfsManager.add(data);
    } catch (error) {
      throw new Error(`Ipfs add request error: ${error}`);
    }
    try {
      await this.ipfsManager.pin([ipfsHash]);
    } catch (error) {
      throw new Error(`Ipfs pin request error: ${error}`);
    }

    const ipfsSize = await this.getSize(ipfsHash);

    return {
      ipfsHash,
      ipfsSize,
    };
  }

  public async getSize(ipfsHash: string): Promise<number> {
    if (!ipfsHash) {
      throw Error('No hash provided');
    }

    let ipfsSize;
    try {
      ipfsSize = await this.ipfsManager.getContentLength(ipfsHash);
    } catch (error) {
      throw new Error(`Ipfs get length request error: ${error}`);
    }

    return ipfsSize;
  }

  /**
   * Gets current configuration
   */
  public async getConfig(): Promise<StorageTypes.IIpfsConfig> {
    return this.ipfsManager.getConfig();
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
      if (!IpfsStorage.hasRequiredBootstrapNodes(bootstrapList)) {
        throw Error(
          `The list of bootstrap node in the ipfs config don't match the expected bootstrap nodes`,
        );
      }
    } catch (error) {
      throw Error(`IPFS node bootstrap node check failed: ${error}`);
    }
  }

  static hasRequiredBootstrapNodes(actualList: string[]): boolean {
    const expectedList = getIpfsExpectedBootstrapNodes();
    return expectedList.every((nodeExpected) =>
      actualList.some((actual) => nodeExpected.test(actual)),
    );
  }
}
