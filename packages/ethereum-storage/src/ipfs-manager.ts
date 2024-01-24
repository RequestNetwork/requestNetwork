import { UnixFS } from 'ipfs-unixfs';
import * as qs from 'qs';
import { LogTypes, StorageTypes } from '@requestnetwork/types';

import { getDefaultIpfsTimeout, getDefaultIpfsUrl, getIpfsErrorHandlingConfig } from './config';
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

export type IpfsOptions = {
  ipfsUrl?: string;
  ipfsTimeout?: number;
  ipfsErrorHandling?: StorageTypes.IIpfsErrorHandlingConfiguration;
  logger?: LogTypes.ILogger;
};
/**
 * Manages Ipfs communication used as storage
 */
export default class IpfsManager {
  private readonly logger: LogTypes.ILogger;
  private readonly httpOptions: { baseURL: string; timeout: number };
  private readonly ipfsErrorHandling: StorageTypes.IIpfsErrorHandlingConfiguration;

  public readonly BASE_PATH: string = 'api/v0';

  /**
   * Constructor
   * @param options.ipfsConnection Object to connect to the ipfs gateway
   * If no values are provided default values from config are used
   * Private network is used for default values
   */
  public constructor(options?: IpfsOptions) {
    const ipfsUrl = options?.ipfsUrl || getDefaultIpfsUrl();
    const ipfsTimeout = options?.ipfsTimeout || getDefaultIpfsTimeout();
    this.ipfsErrorHandling = options?.ipfsErrorHandling || getIpfsErrorHandlingConfig();
    this.logger = options?.logger || new SimpleLogger();

    this.httpOptions = {
      baseURL: `${ipfsUrl}/${this.BASE_PATH}/`,
      timeout: ipfsTimeout,
    };
  }

  private async ipfs<T extends keyof IpfsPaths>(
    path: T,
    config?: {
      data?: unknown;
      params?: Record<string, unknown>;
      timeout?: number;
      headers?: Record<string, unknown>;
    },
  ): Promise<IpfsPaths[T]> {
    const url = new URL(path, this.httpOptions.baseURL);
    if (config?.params) {
      url.search = qs.stringify(config.params, { arrayFormat: 'repeat' });
    }
    const timeout = config?.timeout || this.httpOptions.timeout;

    const fetchWithRetry = retry(fetch, {
      maxRetries: this.ipfsErrorHandling.maxRetries,
      retryDelay: this.ipfsErrorHandling.delayBetweenRetries,
    });
    try {
      const response = await fetchWithRetry(url.toString(), {
        method: 'POST',
        body: config?.data
          ? config.data instanceof FormData
            ? config.data
            : JSON.stringify(config?.data)
          : undefined,
        headers: (config?.headers as Record<string, string>) || {},
        signal: AbortSignal.timeout(timeout),
      });

      if (!response.ok) {
        try {
          const json = await response.json();
          if (json?.Message) {
            throw new Error(json.Message);
          }
        } catch {
          throw new Error(await response.text());
        }
        throw new Error(`${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (e) {
      if (e.name === 'TimeoutError') {
        throw new Error(`timeout of ${timeout}ms exceeded`);
      }
      if (e.message === 'fetch failed' && e.cause) {
        throw e.cause;
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
      addForm.append('file', new Blob([content]));
      const response = await this.ipfs('add', {
        data: addForm,
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
   * @returns Promise resolving retrieved ipfs object
   */
  public async read(hash: string): Promise<StorageTypes.IIpfsObject> {
    try {
      const response = await this.ipfs('object/get', {
        params: { arg: hash, 'data-encoding': 'base64' },
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
      url: this.httpOptions.baseURL || '',
      timeout: this.httpOptions.timeout,
      id: await this.getIpfsNodeId(),
      maxRetries: this.ipfsErrorHandling.maxRetries,
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
