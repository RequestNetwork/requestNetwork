import { StorageTypes } from '@requestnetwork/types';
import * as FormData from 'form-data';
import * as http from 'http';
import * as https from 'https';
import { getDefaultIpfs } from './config';

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

  public readonly IPFS_API_ADD: string = '/api/v0/add';
  public readonly IPFS_API_CAT: string = '/api/v0/object/get';
  public readonly IPFS_API_STAT: string = '/api/v0/object/stat';
  public readonly IPFS_API_CONNECT_SWARM: string = '/api/v0/swarm/connect';
  // eslint-disable-next-line spellcheck/spell-checker
  public readonly IPFS_API_REPOSITORY_VERIFY: string = '/api/v0/repo/verify';
  public readonly IPFS_API_PIN: string = '/api/v0/pin/add';

  /**
   * Constructor
   * @param ipfsConnection Object to connect to the ipfs gateway
   * If no values are provided default values from config are used
   * Private network is used for default values
   */
  public constructor(_ipfsConnection: StorageTypes.IIpfsGatewayConnection = getDefaultIpfs()) {
    this.ipfsConnection = _ipfsConnection;

    this.ipfsConnectionModule = this.getIpfsConnectionModuleModule(this.ipfsConnection.protocol);
  }

  /**
   * Verify ipfs node repository
   * @returns Promise resolving the verify message
   */
  public verifyRepository(): Promise<string> {
    // Promise to wait for response from server
    return new Promise<string>(
      (resolve, reject): void => {
        // Construction get request
        const getRequestString = `${this.ipfsConnection.protocol}://${this.ipfsConnection.host}:${
          this.ipfsConnection.port
        }${this.IPFS_API_REPOSITORY_VERIFY}`;

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
              reject(Error(`Ipfs verification response error: ${e}`));
            });
            res.on('aborted', () => {
              reject(Error('Ipfs verification response has been aborted'));
            });
          })
          .on('abort', () => {
            reject(Error('Ipfs verification has been aborted'));
          })
          .on('error', (e: string) => {
            reject(Error(`Ipfs verification error: ${e}`));
          });
      },
    );
  }

  /**
   * Connect the ipfs node to a new peer
   * @param multiAddresses address of the ipfs node to connect with
   * @returns Promise resolving the peer address
   */
  public connectSwarmPeer(multiAddress: string): Promise<string> {
    // Promise to wait for response from server
    return new Promise<string>(
      (resolve, reject): void => {
        // Construction get request
        const getRequestString = `${this.ipfsConnection.protocol}://${this.ipfsConnection.host}:${
          this.ipfsConnection.port
        }${this.IPFS_API_CONNECT_SWARM}?arg=${multiAddress}`;

        this.ipfsConnectionModule
          .get(getRequestString, (res: any) => {
            let data = '';

            // Chunk of response data
            res.on('data', (chunk: string) => {
              data += chunk;
            });
            // All data has been received
            res.on('end', () => {
              try {
                const parsedData = JSON.parse(data);
                if (parsedData.Type === 'error') {
                  throw Error(parsedData.Message);
                }
                return resolve(multiAddress);
              } catch (e) {
                return reject(Error(`Ipfs connecting peer response error: ${e}`));
              }
            });

            // Error handling
            res.on('error', (e: string) => {
              reject(Error(`Ipfs connecting peer response error: ${e}`));
            });
            res.on('aborted', () => {
              reject(Error('Ipfs connecting peer response has been aborted'));
            });
          })
          .on('abort', () => {
            reject(Error('Ipfs connecting peer has been aborted'));
          })
          .on('error', (e: string) => {
            reject(Error(`Ipfs connecting peer error: ${e}`));
          });
      },
    );
  }

  /**
   * Add the content to ipfs and return ipfs hash
   * @param content Content to add to ipfs
   * @returns Promise resolving the hash of the new added content
   */
  public add(content: string): Promise<string> {
    // Promise to wait for response from server
    return new Promise<string>(
      (resolve, reject): void => {
        // Preparing form data for add request
        const addForm = new FormData();
        addForm.append('file', Buffer.from(content));

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
          // Response data
          res.on('data', (data: string) => {
            let jsonData;
            try {
              jsonData = JSON.parse(data);
            } catch (error) {
              reject(Error('Ipfs add request response cannot be parsed into JSON format'));
            }
            if (!jsonData || !jsonData.Hash) {
              reject(Error('Ipfs add request response has no Hash field'));
            }

            // Return the hash of the response
            resolve(jsonData.Hash);
          });

          res.on('error', (e: string) => {
            reject(Error(`Ipfs add request response error: ${e}`));
          });
          res.on('aborted', () => {
            reject(Error('Ipfs add request response has been aborted'));
          });
        });

        // Throw error on timeout
        addRequest.on('timeout', () => {
          // explicitly abort the request
          addRequest.abort();
          reject(Error('Ipfs add request timeout'));
        });
        addRequest.on('abort', () => {
          reject(Error('Ipfs add request has been aborted'));
        });
        addRequest.on('error', (e: string) => {
          reject(Error(`Ipfs add request error: ${e}`));
        });
      },
    );
  }

  /**
   * Retrieve content from ipfs from its hash
   * @param hash Hash of the content
   * @returns Promise resolving retrieved ipfs object
   */
  public read(hash: string): Promise<StorageTypes.IIpfsObject> {
    // Promise to wait for response from server
    return new Promise<StorageTypes.IIpfsObject>(
      (resolve, reject): void => {
        // Construction get request
        const getRequestString = `${this.ipfsConnection.protocol}://${this.ipfsConnection.host}:${
          this.ipfsConnection.port
        }${this.IPFS_API_CAT}?arg=${hash}`;

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
                  Error('Ipfs object get request response cannot be parsed into JSON format'),
                );
              }
              if (jsonData.Type === 'error') {
                return reject(new Error(`Ipfs object get failed: ${jsonData.Message}`));
              }
              const content = this.getContentFromMarshaledData(jsonData.Data);
              const ipfsSize = jsonData.Data.length;
              const ipfsLinks = jsonData.Links;
              resolve({ content, ipfsSize, ipfsLinks });
            });

            // Error handling
            res.on('error', (e: string) => {
              reject(Error(`Ipfs read request response error: ${e}`));
            });
            res.on('aborted', () => {
              reject(Error('Ipfs read request response has been aborted'));
            });
          })
          .on('timeout', () => {
            // explicitly abort the request
            getRequest.abort();
            reject(Error('Ipfs read request timeout'));
          })
          .on('abort', () => {
            reject(Error('Ipfs read request has been aborted'));
          })
          .on('error', (e: string) => {
            reject(Error(`Ipfs read request error: ${e}`));
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
  public pin(hashes: string[], timeout?: number): Promise<string[]> {
    // Promise to wait for response from server
    return new Promise<string[]>(
      (resolve, reject): void => {
        // Construction get request
        const getRequestString = `${this.ipfsConnection.protocol}://${this.ipfsConnection.host}:${
          this.ipfsConnection.port
        }${this.IPFS_API_PIN}?arg=${hashes.join('&arg=')}`;

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
                reject(Error('Ipfs pin request response cannot be parsed into JSON format'));
              }
              if (!jsonData || !jsonData.Pins) {
                reject(Error('Ipfs pin request response has no Pins field'));
              }

              // Return the hash of the response
              resolve(jsonData.Pins);
            });

            // Error handling
            res.on('error', (e: string) => {
              reject(Error(`Ipfs pin request response error: ${e}`));
            });
            res.on('aborted', () => {
              reject(Error('Ipfs pin request response has been aborted'));
            });
          })
          .on('timeout', () => {
            // explicitly abort the request
            getRequest.abort();
            reject(Error('Ipfs pin request timeout'));
          })
          .on('abort', () => {
            reject(Error('Ipfs pin request has been aborted'));
          })
          .on('error', (e: string) => {
            reject(Error(`Ipfs pin request error: ${e}`));
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
  public getContentLength(hash: string): Promise<number> {
    // Promise to wait for response from server
    return new Promise<number>(
      (resolve, reject): void => {
        // Construction get request
        const getRequestString = `${this.ipfsConnection.protocol}://${this.ipfsConnection.host}:${
          this.ipfsConnection.port
        }${this.IPFS_API_STAT}?arg=${hash}`;

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
                reject(Error('Ipfs stat request response cannot be parsed into JSON format'));
              }
              if (!jsonData || !jsonData.DataSize) {
                reject(Error('Ipfs stat request response has no DataSize field'));
              } else {
                // Return the data size
                resolve(parseInt(jsonData.DataSize, 10));
              }
            });

            // Error handling
            res.on('error', (e: string) => {
              reject(Error(`Ipfs stat request response error: ${e}`));
            });
            res.on('aborted', () => {
              reject(Error('Ipfs stat request response has been aborted'));
            });
          })
          .on('timeout', () => {
            // explicitly abort the request
            getRequest.abort();
            reject(Error('Ipfs stat request timeout'));
          })
          .on('abort', () => {
            reject(Error('Ipfs stat request has been aborted'));
          })
          .on('error', (e: string) => {
            reject(Error(`Ipfs stat request error: ${e}`));
          });

        if (this.ipfsConnection.timeout && this.ipfsConnection.timeout > 0) {
          getRequest.setTimeout(this.ipfsConnection.timeout);
        }
      },
    );
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
  private getContentFromMarshaledData(marshaledData: string): string {
    // eslint-disable-next-line spellcheck/spell-checker
    const unmarshalData = unixfs.unmarshal(Buffer.from(marshaledData)).data.toString();

    // eslint-disable-next-line spellcheck/spell-checker
    return unmarshalData.replace(/[\x00-\x09\x0B-\x1F\x7F-\uFFFF]/g, '');
  }
}
