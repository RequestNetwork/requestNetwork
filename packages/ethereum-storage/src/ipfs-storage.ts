import { LogTypes, StorageTypes } from '@requestnetwork/types';

import { getIpfsExpectedBootstrapNodes, getPinRequestConfig } from './config.js';
import IpfsManager from './ipfs-manager.js';
import { SimpleLogger } from '@requestnetwork/utils';

export type IpfsStorageProps = {
  logger?: LogTypes.ILogger;
  ipfsGatewayConnection?: StorageTypes.IIpfsGatewayConnection;
};

export class IpfsStorage implements StorageTypes.IIpfsStorage {
  private ipfsManager: IpfsManager;
  private logger: LogTypes.ILogger;

  constructor({ ipfsGatewayConnection, logger }: IpfsStorageProps) {
    this.ipfsManager = new IpfsManager({ ipfsGatewayConnection, logger });
    this.logger = logger || new SimpleLogger();
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
    let ipfsHash;
    try {
      ipfsHash = await this.ipfsManager.add(data);
    } catch (error) {
      throw Error(`Ipfs add request error: ${error}`);
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
      await new Promise<void>((res): NodeJS.Timeout => setTimeout(() => res(), delayBetweenCalls));
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
   * Retrieve content from ipfs from its hash
   * @param hash Hash of the content
   * @param maxSize The maximum size of the file to read
   * @returns Promise resolving retrieved ipfs object
   */
  public async read(hash: string, maxSize?: number): Promise<StorageTypes.IIpfsObject> {
    try {
      return this.ipfsManager.read(hash, maxSize);
    } catch (error) {
      throw Error(`Ipfs read request error: ${error}`);
    }
  }

  /**
   * Gets current configuration
   */
  public async getConfig(): Promise<any> {
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
