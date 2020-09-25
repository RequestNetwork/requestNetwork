import { StorageTypes } from '@requestnetwork/types';
import * as FormData from 'form-data';
import * as http from 'http';
import * as https from 'https';
import { getDefaultIpfs, getIpfsErrorHandlingConfig } from './config';
import IpfsConnectionError from './ipfs-connection-error';

// eslint-disable-next-line spellcheck/spell-checker
const unixfs = require('ipfs-unixfs');

/**
 * Manages Ipfs communication used as storage
 */
export default class IpfsManager {
  public ipfsConnection: StorageTypes.IIpfsGatewayConnection;

  /**
   * Node module used to send request to ipfs
   * This attribute is left public for mocking purposes
   */
  public ipfsConnectionModule: any;

  /** IPFS error handling configurations */
  public errorHandlingConfig: StorageTypes.IIpfsErrorHandlingConfiguration;

  public readonly IPFS_API_ADD: string = '/api/v0/add';
  public readonly IPFS_API_CAT: string = '/api/v0/object/get';
  public readonly IPFS_API_STAT: string = '/api/v0/object/stat';
  public readonly IPFS_API_CONNECT_SWARM: string = '/api/v0/swarm/connect';
  // eslint-disable-next-line spellcheck/spell-checker
  public readonly IPFS_API_ID: string = '/api/v0/id';
  public readonly IPFS_API_PIN: string = '/api/v0/pin/add';
  public readonly IPFS_API_BOOTSTRAP_LIST: string = '/api/v0/bootstrap/list';

  /**
   * Constructor
   * @param ipfsConnection Object to connect to the ipfs gateway
   * If no values are provided default values from config are used
   * Private network is used for default values
   */
  public constructor(
    _ipfsConnection: StorageTypes.IIpfsGatewayConnection = getDefaultIpfs(),
    ipfsErrorHandling: StorageTypes.IIpfsErrorHandlingConfiguration = getIpfsErrorHandlingConfig(),
  ) {
    this.ipfsConnection = _ipfsConnection;
    this.errorHandlingConfig = ipfsErrorHandling;

    this.ipfsConnectionModule = this.getIpfsConnectionModuleModule(this.ipfsConnection.protocol);
  }

  /**
   * Get the IPFS node ID
   * @returns Promise resolving the node ID data
   */
  public getIpfsNodeId(): Promise<string> {
    // Promise to wait for response from server
    return new Promise<string>(
      (resolve, reject): void => {
        // Construction get request
        const getRequestString = `${this.ipfsConnection.protocol}://${this.ipfsConnection.host}:${
          this.ipfsConnection.port
        }${this.IPFS_API_ID}`;

        this.ipfsConnectionModule
          .get(getRequestString, (res: any) => {
            let data = '';

            // Chunk of response data
            res.on('data', (chunk: string) => {
              data += chunk;
            });
            // All data has been received
            res.on('end', () => {
              return resolve(data);
            });

            // Error handling
            res.on('error', (e: string) => {
              reject(Error(`Ipfs id response error: ${e}`));
            });
            res.on('aborted', () => {
              reject(Error('Ipfs id response has been aborted'));
            });
          })
          .on('abort', () => {
            reject(Error('Ipfs id has been aborted'));
          })
          .on('error', (e: string) => {
            reject(Error(`Ipfs id error: ${e}`));
          });
      },
    );
  }

  /**
   * Add the content to ipfs and return ipfs hash
   * @param content Content to add to ipfs
   * @returns Promise resolving the hash of the new added content
   */
  public add(content: string, retries: number = 0): Promise<string> {
    // Promise to wait for response from server
    return new Promise<string>(
      (resolve, reject): void => {
        // Preparing form data for add request
        const addForm = new FormData();
        addForm.append('file', Buffer.from(content));

        // Flag if a timeout error was thrown
        let didTimeout = false;

        // Creating object for add request
        const addRequest = this.ipfsConnectionModule.request({
          headers: addForm.getHeaders(),
          host: this.ipfsConnection.host,
          method: 'post',
          path: this.IPFS_API_ADD,
          port: this.ipfsConnection.port,
        });
        // Sending the request
        addForm.pipe(addRequest);

        if (this.ipfsConnection.timeout && this.ipfsConnection.timeout > 0) {
          addRequest.setTimeout(this.ipfsConnection.timeout);
        }

        // Waiting for response
        addRequest.on('response', (res: any) => {
          let data = '';
          // Response data
          res.on('data', (chunk: string) => {
            data += chunk;
          });

          res.on('end', () => {
            let jsonData;
            try {
              jsonData = JSON.parse(data);
            } catch (error) {
              return reject(Error('Ipfs add request response cannot be parsed into JSON format'));
            }
            if (!jsonData || !jsonData.Hash) {
              return reject(Error('Ipfs add request response has no Hash field'));
            }
            // Return the hash of the response
            resolve(jsonData.Hash);
          });

          res.on('error', (e: string) => {
            // If maxRetries is set, and we haven't reached maxRetries, retry the request
            if (
              this.errorHandlingConfig.maxRetries &&
              retries <= this.errorHandlingConfig.maxRetries
            ) {
              setTimeout(
                () => resolve(this.add(content, retries + 1)),
                this.errorHandlingConfig.delayBetweenRetries,
              );
            } else {
              return reject(Error(`Ipfs add request response error: ${e}`));
            }
          });
          res.on('aborted', () => {
            return reject(Error('Ipfs add request response has been aborted'));
          });
        });

        // Throw error on timeout
        addRequest.on('timeout', () => {
          didTimeout = true;
          // explicitly abort the request
          addRequest.abort();
          return reject(Error('Ipfs add request timeout'));
        });
        addRequest.on('abort', () => {
          return reject(Error('Ipfs add request has been aborted'));
        });
        addRequest.on('error', (e: string) => {
          // If the error isn't a timeout, maxRetries is set, and we haven't reached maxRetries, retry the request
          if (
            !didTimeout &&
            this.errorHandlingConfig.maxRetries &&
            retries <= this.errorHandlingConfig.maxRetries
          ) {
            setTimeout(
              () => resolve(this.add(content, retries + 1)),
              this.errorHandlingConfig.delayBetweenRetries,
            );
          } else {
            return reject(Error(`Ipfs add request error: ${e}`));
          }
        });
      },
    );
  }

  /**
   * Retrieve content from ipfs from its hash
   * @param hash Hash of the content
   * @param maxSize The maximum size of the file to read
   * @returns Promise resolving retrieved ipfs object
   */
  public read(
    hash: string,
    maxSize: number = Number.POSITIVE_INFINITY,
    retries: number = 0,
  ): Promise<StorageTypes.IIpfsObject> {
    // Promise to wait for response from server
    return new Promise<StorageTypes.IIpfsObject>(
      (resolve, reject): void => {
        // Construction get request
        const getRequestString = `${this.ipfsConnection.protocol}://${this.ipfsConnection.host}:${
          this.ipfsConnection.port
        }${this.IPFS_API_CAT}?arg=${hash}&data-encoding=base64`;

        // Flag if a timeout error was thrown
        let didTimeout = false;

        const getRequest = this.ipfsConnectionModule
          .get(getRequestString, (res: any) => {
            let data = '';

            // Chunk of response data
            res.on('data', (chunk: string) => {
              data += chunk;
              // decode the base64 to compute the actual size of the data
              if (Buffer.from(data, 'base64').length > maxSize) {
                getRequest.abort();
                res.destroy();
                return reject(
                  new Error(`File size (${data.length}) exceeds the declared file size (${maxSize})`),
                );
              }
            });

            // All data has been received
            res.on('end', () => {
              let jsonData;
              try {
                jsonData = JSON.parse(data);
              } catch (error) {
                return reject(
                  new Error('Ipfs object get request response cannot be parsed into JSON format'),
                );
              }
              if (jsonData.Type === 'error') {
                return reject(new Error(`Ipfs object get failed: ${jsonData.Message}`));
              }
              const ipfsDataBuffer = Buffer.from(jsonData.Data, 'base64');
              const content = this.getContentFromMarshaledData(ipfsDataBuffer);
              const ipfsSize = ipfsDataBuffer.length;
              const ipfsLinks = jsonData.Links;
              resolve({ content, ipfsSize, ipfsLinks });
            });

            // Error handling
            res.on('error', (e: string) => {
              // If maxRetries is set, and we haven't reached maxRetries, retry the request
              if (
                this.errorHandlingConfig.maxRetries &&
                retries <= this.errorHandlingConfig.maxRetries
              ) {
                setTimeout(
                  () => resolve(this.read(hash, maxSize, retries + 1)),
                  this.errorHandlingConfig.delayBetweenRetries,
                );
              } else {
                return reject(new IpfsConnectionError(`Ipfs read request response error: ${e}`));
              }
            });
            res.on('aborted', () => {
              return reject(new IpfsConnectionError('Ipfs read request response has been aborted'));
            });
          })
          .on('timeout', () => {
            didTimeout = true;
            // explicitly abort the request
            getRequest.abort();
            return reject(new IpfsConnectionError('Ipfs read request timeout'));
          })
          .on('abort', () => {
            return reject(new IpfsConnectionError('Ipfs read request has been aborted'));
          })
          .on('error', (e: string) => {
            // If the error isn't a timeout, maxRetries is set, and we haven't reached maxRetries, retry the request
            if (
              !didTimeout &&
              this.errorHandlingConfig.maxRetries &&
              retries <= this.errorHandlingConfig.maxRetries
            ) {
              setTimeout(
                () => resolve(this.read(hash, maxSize, retries + 1)),
                this.errorHandlingConfig.delayBetweenRetries,
              );
            } else {
              return reject(new IpfsConnectionError(`Ipfs read request error: ${e}`));
            }
          });

        if (this.ipfsConnection.timeout && this.ipfsConnection.timeout > 0) {
          getRequest.setTimeout(this.ipfsConnection.timeout);
        }
      },
    );
  }

  /**
   * Pin content on ipfs node from its hash
   * @param hashes Array of hashes of the content
   * @param [timeout] An optional timeout for the IPFS pin request
   * @returns Promise resolving the hash pinned after pinning the content
   */
  public pin(hashes: string[], timeout?: number, retries: number = 0): Promise<string[]> {
    // Promise to wait for response from server
    return new Promise<string[]>(
      (resolve, reject): void => {
        // Construction get request
        const getRequestString = `${this.ipfsConnection.protocol}://${this.ipfsConnection.host}:${
          this.ipfsConnection.port
        }${this.IPFS_API_PIN}?arg=${hashes.join('&arg=')}`;

        // Flag if a timeout error was thrown
        let didTimeout = false;

        const getRequest = this.ipfsConnectionModule
          .get(getRequestString, (res: any) => {
            let data = '';

            // Chunk of response data
            res.on('data', (chunk: string) => {
              data += chunk;
            });

            // Response data
            res.on('end', () => {
              let jsonData;
              try {
                jsonData = JSON.parse(data);
              } catch (error) {
                return reject(Error('Ipfs pin request response cannot be parsed into JSON format'));
              }
              if (!jsonData || !jsonData.Pins) {
                return reject(Error('Ipfs pin request response has no Pins field'));
              }

              // Return the hash of the response
              resolve(jsonData.Pins);
            });

            // Error handling
            res.on('error', (e: string) => {
              // If maxRetries is set, and we haven't reached maxRetries, retry the request
              if (
                this.errorHandlingConfig.maxRetries &&
                retries <= this.errorHandlingConfig.maxRetries
              ) {
                setTimeout(
                  () => resolve(this.pin(hashes, timeout, retries + 1)),
                  this.errorHandlingConfig.delayBetweenRetries,
                );
              } else {
                return reject(Error(`Ipfs pin request response error: ${e}`));
              }
            });
            res.on('aborted', () => {
              return reject(Error('Ipfs pin request response has been aborted'));
            });
          })
          .on('timeout', () => {
            didTimeout = true;
            // explicitly abort the request
            getRequest.abort();
            return reject(Error('Ipfs pin request timeout'));
          })
          .on('abort', () => {
            return reject(Error('Ipfs pin request has been aborted'));
          })
          .on('error', (e: string) => {
            // If the error isn't a timeout, maxRetries is set, and we haven't reached maxRetries, retry the request
            if (
              !didTimeout &&
              this.errorHandlingConfig.maxRetries &&
              retries <= this.errorHandlingConfig.maxRetries
            ) {
              setTimeout(
                () => resolve(this.pin(hashes, timeout, retries + 1)),
                this.errorHandlingConfig.delayBetweenRetries,
              );
            } else {
              return reject(Error(`Ipfs pin request error: ${e}`));
            }
          });

        if (timeout || (this.ipfsConnection.timeout && this.ipfsConnection.timeout > 0)) {
          getRequest.setTimeout(timeout || this.ipfsConnection.timeout);
        }
      },
    );
  }

  /**
   * Get the size of a content from ipfs from its hash
   * @param hash Hash of the content
   * @returns Promise resolving size of the content
   */
  public getContentLength(hash: string, retries: number = 0): Promise<number> {
    // Promise to wait for response from server
    return new Promise<number>(
      (resolve, reject): void => {
        // Construction get request
        const getRequestString = `${this.ipfsConnection.protocol}://${this.ipfsConnection.host}:${
          this.ipfsConnection.port
        }${this.IPFS_API_STAT}?arg=${hash}`;

        // Flag if a timeout error was thrown
        let didTimeout = false;

        const getRequest = this.ipfsConnectionModule
          .get(getRequestString, (res: any) => {
            let data = '';

            // Chunk of response data
            res.on('data', (chunk: string) => {
              data += chunk;
            });
            // All data has been received
            res.on('end', () => {
              let jsonData;
              try {
                jsonData = JSON.parse(data);
              } catch (error) {
                return reject(
                  Error('Ipfs stat request response cannot be parsed into JSON format'),
                );
              }
              if (!jsonData || !jsonData.DataSize) {
                return reject(Error('Ipfs stat request response has no DataSize field'));
              } else {
                // Return the data size
                resolve(parseInt(jsonData.DataSize, 10));
              }
            });

            // Error handling
            res.on('error', (e: string) => {
              // If maxRetries is set, and we haven't reached maxRetries, retry the request
              if (
                this.errorHandlingConfig.maxRetries &&
                retries <= this.errorHandlingConfig.maxRetries
              ) {
                setTimeout(
                  () => resolve(this.getContentLength(hash, retries + 1)),
                  this.errorHandlingConfig.delayBetweenRetries,
                );
              } else {
                return reject(Error(`Ipfs stat request response error: ${e}`));
              }
            });
            res.on('aborted', () => {
              return reject(Error('Ipfs stat request response has been aborted'));
            });
          })
          .on('timeout', () => {
            didTimeout = true;
            // explicitly abort the request
            getRequest.abort();
            return reject(Error('Ipfs stat request timeout'));
          })
          .on('abort', () => {
            return reject(Error('Ipfs stat request has been aborted'));
          })
          .on('error', (e: string) => {
            // If the error isn't a timeout, maxRetries is set, and we haven't reached maxRetries, retry the request
            if (
              !didTimeout &&
              this.errorHandlingConfig.maxRetries &&
              retries <= this.errorHandlingConfig.maxRetries
            ) {
              setTimeout(
                () => resolve(this.getContentLength(hash, retries + 1)),
                this.errorHandlingConfig.delayBetweenRetries,
              );
            } else {
              return reject(Error(`Ipfs stat request error: ${e}`));
            }
          });

        if (this.ipfsConnection.timeout && this.ipfsConnection.timeout > 0) {
          getRequest.setTimeout(this.ipfsConnection.timeout);
        }
      },
    );
  }

  /**
   * Get the list of the bootstrap nodes
   * @returns Promise resolving an array of the bootstrap nodes
   */
  public getBootstrapList(): Promise<string[]> {
    // Promise to wait for response from server
    return new Promise<string[]>(
      (resolve, reject): void => {
        // Construction get request
        const getRequestString = `${this.ipfsConnection.protocol}://${this.ipfsConnection.host}:${
          this.ipfsConnection.port
        }${this.IPFS_API_BOOTSTRAP_LIST}`;

        this.ipfsConnectionModule
          .get(getRequestString, (res: any) => {
            let data = '';

            // Chunk of response data
            res.on('data', (chunk: string) => {
              data += chunk;
            });

            // All data has been received
            res.on('end', () => {
              let jsonData;
              try {
                jsonData = JSON.parse(data);
              } catch (error) {
                return reject(Error('Ipfs bootstrap list request response cannot be parsed'));
              }
              if (!jsonData || !jsonData.Peers) {
                return reject(Error('Ipfs bootstrap list request response has no Peers field'));
              } else {
                // Return the bootstrap nodes
                resolve(jsonData.Peers);
              }
            });

            // Error handling
            res.on('error', (e: string) => {
              reject(Error(`Ipfs bootstrap list response error: ${e}`));
            });
            res.on('aborted', () => {
              reject(Error('Ipfs bootstrap list response has been aborted'));
            });
          })
          .on('abort', () => {
            reject(Error('Ipfs bootstrap list has been aborted'));
          })
          .on('error', (e: string) => {
            reject(Error(`Ipfs bootstrap list error: ${e}`));
          });
      },
    );
  }

  /**
   * Gets current configuration
   *
   * @return the current configuration attributes
   */
  public async getConfig(): Promise<any> {
    return {
      delayBetweenRetries: this.errorHandlingConfig.delayBetweenRetries,
      host: this.ipfsConnection.host,
      id: JSON.parse(await this.getIpfsNodeId()),
      maxRetries: this.errorHandlingConfig.maxRetries,
      port: this.ipfsConnection.port,
      protocol: this.ipfsConnection.protocol,
      timeout: this.ipfsConnection.timeout,
    };
  }

  /**
   * Get the javascript network module used to send request to ipfs
   * @param protocol Protocol used to send ipfs requests
   * @returns Network module
   */
  private getIpfsConnectionModuleModule(protocol: StorageTypes.IpfsGatewayProtocol): any {
    const protocolModule = {
      [StorageTypes.IpfsGatewayProtocol.HTTP as StorageTypes.IpfsGatewayProtocol]: http,
      [StorageTypes.IpfsGatewayProtocol.HTTPS as StorageTypes.IpfsGatewayProtocol]: https,
    }[protocol];

    if (!protocolModule) {
      throw Error('Protocol not implemented for IPFS');
    }

    return protocolModule;
  }

  /**
   * Removes the Unicode special character from a ipfs content
   * @param marshaledData marshaled data
   * @returns the content without the padding
   */
  private getContentFromMarshaledData(marshaledData: Buffer): string {
    // eslint-disable-next-line spellcheck/spell-checker
    const unmarshalData = unixfs.unmarshal(marshaledData).data.toString();

    // eslint-disable-next-line spellcheck/spell-checker
    return unmarshalData.replace(/[\x00-\x09\x0B-\x1F\x7F-\uFFFF]/g, '');
  }
}
