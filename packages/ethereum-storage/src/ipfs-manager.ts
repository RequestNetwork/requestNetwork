import * as unixfs from 'ipfs-unixfs';
import axios, { AxiosInstance, AxiosResponse } from 'axios';
import Utils from '@requestnetwork/utils';
import { LogTypes, StorageTypes } from '@requestnetwork/types';

import { getDefaultIpfs, getIpfsErrorHandlingConfig } from './config';
import axiosRetry from 'axios-retry';
import * as FormData from 'form-data';

/**
 * Manages Ipfs communication used as storage
 */
export default class IpfsManager {
  private logger: LogTypes.ILogger;
  private axiosInstance: AxiosInstance;
  private ipfsGatewayConnection: StorageTypes.IIpfsGatewayConnection;
  private ipfsErrorHandling: StorageTypes.IIpfsErrorHandlingConfiguration;

  public readonly IPFS_API_ADD: string = '/api/v0/add';
  public readonly IPFS_API_CAT: string = '/api/v0/object/get';
  public readonly IPFS_API_STAT: string = '/api/v0/object/stat';
  public readonly IPFS_API_CONNECT_SWARM: string = '/api/v0/swarm/connect';

  public readonly IPFS_API_ID: string = '/api/v0/id';
  public readonly IPFS_API_PIN: string = '/api/v0/pin/add';
  public readonly IPFS_API_BOOTSTRAP_LIST: string = '/api/v0/bootstrap/list';

  /**
   * Constructor
   * @param options.ipfsConnection Object to connect to the ipfs gateway
   * If no values are provided default values from config are used
   * Private network is used for default values
   * @param options.ipfsErrorHandling
   * @param options.logger
   */
  public constructor(options?: {
    ipfsGatewayConnection?: StorageTypes.IIpfsGatewayConnection;
    ipfsErrorHandling?: StorageTypes.IIpfsErrorHandlingConfiguration;
    logger?: LogTypes.ILogger;
  }) {
    this.ipfsGatewayConnection = options?.ipfsGatewayConnection || getDefaultIpfs();
    this.ipfsErrorHandling = options?.ipfsErrorHandling || getIpfsErrorHandlingConfig();
    this.logger = options?.logger || new Utils.SimpleLogger();
    this.axiosInstance = axios.create({
      baseURL: `${this.ipfsGatewayConnection.protocol}://${this.ipfsGatewayConnection.host}:${this.ipfsGatewayConnection.port}`,
      timeout: this.ipfsGatewayConnection.timeout,
    });
    axiosRetry(this.axiosInstance, {
      retries: this.ipfsErrorHandling.maxRetries,
      retryDelay: () => this.ipfsErrorHandling.delayBetweenRetries,
    });
  }

  /**
   * Get the IPFS node ID
   * @returns Promise resolving the node ID data
   */
  public async getIpfsNodeId(): Promise<string> {
    try {
      const response = await this.axiosInstance.get(this.IPFS_API_ID);
      return response.data;
    } catch (e) {
      this.logger.error(`Failed to retrieve IPFS node ID: ${e.message}`, ['ipfs']);
      throw e;
    }
  }

  /**
   * Add the content to ipfs and return ipfs hash
   * @param content Content to add to ipfs
   * @returns Promise resolving the hash of the new added content
   */
  public async add(content: string): Promise<string> {
    try {
      const addForm = new FormData();
      addForm.append('file', Buffer.from(content));
      const response = await this.axiosInstance.post(this.IPFS_API_ADD, addForm, {
        headers: addForm.getHeaders(),
      });
      // Return the hash of the response
      const hash = response.data.Hash;
      if (!hash) {
        throw new Error('response has no Hash field');
      }
      return hash;
    } catch (e) {
      this.logger.error(`Failed to add IPFS file: ${e.message}`, ['ipfs']);
      throw e;
    }
  }

  /**
   * Retrieve content from ipfs from its hash
   * @param hash Hash of the content
   * @param maxSize The maximum size of the file to read
   * @returns Promise resolving retrieved ipfs object
   */
  public async read(
    hash: string,
    maxSize: number = Number.POSITIVE_INFINITY,
  ): Promise<StorageTypes.IIpfsObject> {
    try {
      if (maxSize !== Number.POSITIVE_INFINITY) {
        const maxSizeBase64 = ((4 * maxSize) / 3 + 3) & ~3;
        const jsonMinSize = 500;
        maxSize = Math.max(maxSizeBase64, jsonMinSize);
      }
      const response: AxiosResponse = await this.axiosInstance.get(
        `${this.IPFS_API_CAT}?arg=${hash}&data-encoding=base64`,
        { maxContentLength: maxSize },
      );
      if (response.data.Type === 'error') {
        throw new Error(response.data.Message);
      }
      const ipfsDataBuffer = Buffer.from(response.data.Data, 'base64');
      const content = IpfsManager.getContentFromMarshaledData(ipfsDataBuffer);
      const ipfsSize = ipfsDataBuffer.length;
      const ipfsLinks = response.data.Links;
      return { content, ipfsSize, ipfsLinks };
    } catch (e) {
      this.logger.error(`Failed to read IPFS file: ${e.message}`, ['ipfs']);
      throw e;
    }
  }

  /**
   * Pin content on ipfs node from its hash
   * @param hashes Array of hashes of the content
   * @param [timeout] An optional timeout for the IPFS pin request
   * @returns Promise resolving the hash pinned after pinning the content
   */
  public async pin(hashes: string[], timeout?: number): Promise<string[]> {
    try {
      const response = await this.axiosInstance.get(
        `${this.IPFS_API_PIN}?arg=${hashes.join('&arg=')}`,
        { timeout },
      );
      const pins = response.data.Pins;
      if (!pins) {
        throw new Error('Ipfs pin request response has no Pins field');
      }
      return pins;
    } catch (e) {
      this.logger.error(`Failed to pin IPFS file: ${e.message}`, ['ipfs']);
      throw e;
    }
  }

  /**
   * Get the size of a content from ipfs from its hash
   * @param hash Hash of the content
   * @returns Promise resolving size of the content
   */
  public async getContentLength(hash: string): Promise<number> {
    try {
      const response = await this.axiosInstance.get(`${this.IPFS_API_STAT}?arg=${hash}`);
      const length = response.data.DataSize;
      if (!length) {
        throw new Error('Ipfs stat request response has no DataSize field');
      }
      return parseInt(length, 10);
    } catch (e) {
      this.logger.error(`Failed to retrieve IPFS file size: ${e.message}`, ['ipfs']);
      throw e;
    }
  }

  /**
   * Get the list of the bootstrap nodes
   * @returns Promise resolving an array of the bootstrap nodes
   */
  public async getBootstrapList(): Promise<string[]> {
    try {
      const response = await this.axiosInstance.get(this.IPFS_API_BOOTSTRAP_LIST);
      const peers = response.data.Peers;
      if (!peers) {
        throw new Error('Ipfs bootstrap list request response has no Peers field');
      }
      return peers;
    } catch (e) {
      this.logger.error(`Failed to retrieve IPFS file size: ${e.message}`, ['ipfs']);
      throw e;
    }
  }

  /**
   * Gets current configuration
   *
   * @return the current configuration attributes
   */
  public async getConfig(): Promise<StorageTypes.IIpfsConfig> {
    return {
      delayBetweenRetries: this.ipfsErrorHandling.delayBetweenRetries,
      host: this.ipfsGatewayConnection.host,
      id: await this.getIpfsNodeId(),
      maxRetries: this.ipfsErrorHandling.maxRetries,
      port: this.ipfsGatewayConnection.port,
      protocol: this.ipfsGatewayConnection.protocol,
      timeout: this.ipfsGatewayConnection.timeout,
    };
  }

  /**
   * Removes the Unicode special character from a ipfs content
   * @param marshaledData marshaled data
   * @returns the content without the padding
   */
  private static getContentFromMarshaledData(marshaledData: Buffer): string {
    const unmarshalData = unixfs.unmarshal(marshaledData).data.toString();
    // eslint-disable-next-line no-control-regex
    return unmarshalData.replace(/[\x00-\x09\x0B-\x1F\x7F-\uFFFF]/g, '');
  }
}
