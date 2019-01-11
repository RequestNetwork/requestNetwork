import { Storage as StorageTypes } from '@requestnetwork/types';
import * as FormData from 'form-data';
import * as http from 'http';
import * as https from 'https';
import { getDefaultIpfs } from './config';

/**
 * Manages Ipfs communication used as storage
 */
export default class IpfsManager {
  public ipfsConnection: StorageTypes.IIpfsGatewayConnection;

  public readonly IPFS_API_ADD: string = '/api/v0/add';
  public readonly IPFS_API_CAT: string = '/api/v0/cat';
  public readonly IPFS_API_STAT: string = '/api/v0/object/stat';

  /**
   * Constructor
   * @param ipfsConnection Object to connect to the ipfs gateway
   * If no values are provided default values from config are used
   * Private network is used for default values
   */
  public constructor(_ipfsConnection: StorageTypes.IIpfsGatewayConnection = getDefaultIpfs()) {
    this.ipfsConnection = _ipfsConnection;
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
        const protocolModule: any = this.getProtocolModule(this.ipfsConnection.protocol);

        // Preparing form data for add request
        const addForm = new FormData();
        addForm.append('file', Buffer.from(content));

        // Creating object for add request
        const addRequest = protocolModule.request({
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

          // Error handling
          res.on('error', (e: string) => {
            reject(Error(`Ipfs add request response error: ${e}`));
          });
          res.on('aborted', () => {
            reject(Error('Ipfs add request has been aborted'));
          });
        });

        // Throw error on timeout
        addRequest.on('timeout', () => {
          reject(Error('Ipfs add request timeout'));
        });
        // Throw error on abort
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
   * @returns Promise resolving retrieved content in UTF8 encoding
   */
  public read(hash: string): Promise<string> {
    // Promise to wait for response from server
    return new Promise<string>(
      (resolve, reject): void => {
        const protocolModule: any = this.getProtocolModule(this.ipfsConnection.protocol);

        // Construction get request
        const getRequestString = `${this.ipfsConnection.protocol}://${this.ipfsConnection.host}:${
          this.ipfsConnection.port
        }${this.IPFS_API_CAT}?arg=${hash}`;

        const getRequest = protocolModule
          .get(getRequestString, (res: any) => {
            let data = '';

            // Chunk of response data
            res.on('data', (chunk: string) => {
              data += chunk;
            });
            // All data has been received
            res.on('end', () => {
              resolve(data);
            });
            // Error handling
            res.on('error', (e: string) => {
              reject(Error(`Ipfs read request response error: ${e}`));
            });
            res.on('aborted', () => {
              reject(Error('Ipfs read request has been aborted'));
            });
          })
          .on('timeout', () => {
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
   * Get the size of a content from ipfs from its hash
   * @param hash Hash of the content
   * @returns Promise resolving size of the content
   */
  public getContentLength(hash: string): Promise<number> {
    // Promise to wait for response from server
    return new Promise<number>(
      (resolve, reject): void => {
        const protocolModule: any = this.getProtocolModule(this.ipfsConnection.protocol);

        // Construction get request
        const getRequestString = `${this.ipfsConnection.protocol}://${this.ipfsConnection.host}:${
          this.ipfsConnection.port
        }${this.IPFS_API_STAT}?arg=${hash}`;

        const getRequest = protocolModule
          .get(getRequestString, (res: any) => {
            let data = '';

            // Chunk of response data
            res.on('data', (chunk: string) => {
              data += chunk;
            });
            // All data has been received
            res.on('end', () => {
              const jsonData = JSON.parse(data);

              if (!jsonData.DataSize) {
                reject(Error('Ipfs stat request response has no DataSize field'));
              }

              // Return the data size
              resolve(parseInt(jsonData.DataSize, 10));
            });
            // Error handling
            res.on('error', (e: string) => {
              reject(Error(`Ipfs stat request response error: ${e}`));
            });
            res.on('aborted', () => {
              reject(Error('Ipfs stat request has been aborted'));
            });
          })
          .on('timeout', () => {
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
  public getProtocolModule(protocol: StorageTypes.IpfsGatewayProtocol): any {
    if (!protocol) {
      throw Error('Protocol not specified');
    }

    const protocolModule = {
      [StorageTypes.IpfsGatewayProtocol.HTTP as StorageTypes.IpfsGatewayProtocol]: http,
      [StorageTypes.IpfsGatewayProtocol.HTTPS as StorageTypes.IpfsGatewayProtocol]: https,
    }[protocol];

    if (!protocolModule) {
      throw Error('Protocol not implemented for IPFS');
    }

    return protocolModule;
  }
}
