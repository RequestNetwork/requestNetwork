import { UnixFS } from 'ipfs-unixfs';
import * as qs from 'qs';
import axios, { AxiosError, AxiosInstance, AxiosRequestConfig } from 'axios';
import { LogTypes, StorageTypes } from '@requestnetwork/types';

import { getDefaultIpfs, getIpfsErrorHandlingConfig } from './config.js';
import * as FormData from 'form-data';
import { retry, SimpleLogger } from '@requestnetwork/utils';

/** A mapping between IPFS Paths and the response type */
type IpfsPaths = {
  id: string;
  add: { Hash: string };
  'object/get':
    | { Type: 'error'; Message: string }
    | { Type: undefined; Data: string; Links: string[] };
  'object/stat': { DataSize: number };
  'pin/add': { Pins: string[] };
  'bootstrap/list': { Peers: string[] };
};

/**
 * Manages Ipfs communication used as storage
 */
export default class IpfsManager {
  private readonly logger: LogTypes.ILogger;
  private readonly axiosInstance: AxiosInstance;
  private readonly ipfsGatewayConnection: StorageTypes.IIpfsGatewayConnection;
  private readonly ipfsErrorHandling: StorageTypes.IIpfsErrorHandlingConfiguration;

  public readonly BASE_PATH: string = 'api/v0';

  /**
   * Constructor
   * @param options.ipfsConnection Object to connect to the ipfs gateway
   * If no values are provided default values from config are used
   * Private network is used for default values
   */
  public constructor(options?: {
    ipfsGatewayConnection?: StorageTypes.IIpfsGatewayConnection;
    ipfsErrorHandling?: StorageTypes.IIpfsErrorHandlingConfiguration;
    logger?: LogTypes.ILogger;
  }) {
    this.ipfsGatewayConnection = options?.ipfsGatewayConnection || getDefaultIpfs();
    this.ipfsErrorHandling = options?.ipfsErrorHandling || getIpfsErrorHandlingConfig();
    this.logger = options?.logger || new SimpleLogger();

    this.axiosInstance = axios.create({
      baseURL: `${this.ipfsGatewayConnection.protocol}://${this.ipfsGatewayConnection.host}:${this.ipfsGatewayConnection.port}/${this.BASE_PATH}/`,
      timeout: this.ipfsGatewayConnection.timeout,
      paramsSerializer: function (params) {
        return qs.stringify(params, { arrayFormat: 'repeat' });
      },
    });
  }

  private async ipfs<T extends keyof IpfsPaths>(path: T, config?: AxiosRequestConfig) {
    const _post = retry(this.axiosInstance.post, {
      context: this.axiosInstance,
      maxRetries: this.ipfsErrorHandling.maxRetries,
      retryDelay: this.ipfsErrorHandling.delayBetweenRetries,
    });
    try {
      const { data, ...rest } = config || {};
      const response = await _post<IpfsPaths[T]>(path, data, rest);
      return response.data;
    } catch (e) {
      const axiosError = e as AxiosError<{ Message?: string }>;
      if (axiosError.isAxiosError && axiosError.response?.data?.Message) {
        throw new Error(axiosError.response.data.Message);
      }
      throw e;
    }
  }

  /**
   * Get the IPFS node ID
   * @returns Promise resolving the node ID data
   */
  public async getIpfsNodeId(): Promise<string> {
    try {
      return await this.ipfs('id');
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
      const response = await this.ipfs('add', {
        data: addForm,
        headers: addForm.getHeaders(),
      });
      // Return the hash of the response
      const hash = response.Hash;
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
   * @param maxSize The maximum size of the file to read, in bytes. This is the unixfs file size, as represented on IPFS.
   * @returns Promise resolving retrieved ipfs object
   */
  public async read(
    hash: string,
    maxSize: number = Number.POSITIVE_INFINITY,
  ): Promise<StorageTypes.IIpfsObject> {
    try {
      if (maxSize !== Number.POSITIVE_INFINITY) {
        // In order to prevent downloading a file that is too big, we can set maxContentLength in axios options.
        // maxContentLength defines the maximum allowed size of the HTTP response in bytes.
        // The IPFS HTTP RPC API returns a JSON with some metadata around the actual file itself, so we need to take that into consideration.
        const jsonMetadataSize = 500;
        // We ask the IPFS node to return a file encoded in base64 to avoid JSON in JSON, and in case of binary data.
        // Let's transform the max file size in bytes, to the max length of the base64 string that represents the file.
        // This will be our max content length in bytes, since each base64 string characters is encoded as one byte in UTF-8.
        const base64StringMaxLength = ((4 * maxSize) / 3 + 3) & ~3; // https://stackoverflow.com/a/32140193/16270345
        maxSize = base64StringMaxLength + jsonMetadataSize;
      }
      const response = await this.ipfs('object/get', {
        params: { arg: hash, 'data-encoding': 'base64' },
        maxContentLength: maxSize,
      });
      if (response.Type === 'error') {
        throw new Error(response.Message);
      }
      const ipfsDataBuffer = Buffer.from(response.Data, 'base64');
      const content = IpfsManager.getContentFromMarshaledData(ipfsDataBuffer);
      const ipfsSize = ipfsDataBuffer.length;
      const ipfsLinks = response.Links;
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
      const response = await this.ipfs('pin/add', {
        params: { arg: hashes },
        timeout,
      });
      const pins = response.Pins;
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
      const response = await this.ipfs('object/stat', { params: { arg: hash } });
      const length = response.DataSize;
      if (!length) {
        throw new Error('Ipfs stat request response has no DataSize field');
      }
      return length;
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
      const response = await this.ipfs('bootstrap/list');
      const peers = response.Peers;
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
   * Removes the Unicode special characters from an IPFS content
   * @param marshaledData marshaled data
   * @returns the content without the padding
   */
  private static getContentFromMarshaledData(marshaledData: Buffer): string {
    const { data } = UnixFS.unmarshal(marshaledData);
    if (!data) throw new Error('Cannot unmarshal data');
    return data.toString();
  }
}
