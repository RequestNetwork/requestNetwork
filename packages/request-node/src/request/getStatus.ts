import { DataAccessTypes, LogTypes } from '@requestnetwork/types';
import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import * as config from '../config';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const packageJson = require('../../package.json');

const GET_CHANNELS_TIMEOUT = 600000;

/**
 * Handles getStatus of data-access layer.
 *
 * @param clientRequest http client request object
 * @param serverResponse http server response object
 * @param dataAccess data access layer
 */
export default class GetStatusHandler {
  constructor(private logger: LogTypes.ILogger, private dataAccess: DataAccessTypes.IDataAccess) {
    this.handler = this.handler.bind(this);
  }
  async handler(clientRequest: Request, serverResponse: Response): Promise<void> {
    // Used to compute request time
    const requestStartTime = Date.now();

    // As the Node doesn't implement a cache, all transactions have to be retrieved directly on IPFS
    // This operation can take a long time and then the timeout of the request should be increase
    // PROT-187: Decrease or remove this value
    clientRequest.setTimeout(GET_CHANNELS_TIMEOUT);

    if (!this.dataAccess._getStatus) {
      serverResponse
        .status(StatusCodes.INTERNAL_SERVER_ERROR)
        .send('The node do not support this feature');
      return;
    }

    try {
      const dataAccessStatus = await this.dataAccess._getStatus(
        Boolean(clientRequest.query.detailed),
      );
      let providerUrl = '';

      // let's extract only the hostname to hide any token or sensible key
      try {
        const providerUrlObject: URL = new URL(config.getStorageWeb3ProviderUrl());
        providerUrl = providerUrlObject.hostname;
      } catch (e) {
        providerUrl = 'Error: not an URL format';
      }

      const status = {
        dataAccess: dataAccessStatus,
        node: {
          customHeaders: config.getCustomHeaders(),
          ethereum: {
            concurrency: config.getStorageConcurrency(),
            lastBlockNumberDelay: config.getLastBlockNumberDelay(),
            networkId: config.getStorageNetworkId(),
            providerUrl,
            retryDelay: config.getEthereumRetryDelay(),
          },
          ipfs: {
            host: config.getIpfsHost(),
            port: config.getIpfsPort(),
            protocol: config.getIpfsProtocol(),
            timeout: config.getIpfsTimeout(),
          },
          persistTransactionTimeout: config.getPersistTransactionTimeout(),
          port: config.getServerPort(),
          serverExternalUrl: config.getServerExternalUrl(),
          version: packageJson.version,
        },
      };

      // Log the request time
      const requestEndTime = Date.now();
      this.logger.debug(`getStatus latency: ${requestEndTime - requestStartTime}ms`, [
        'metric',
        'latency',
      ]);

      serverResponse.status(StatusCodes.OK).send(status);
    } catch (e) {
      this.logger.error(`getStatus error: ${e}`);

      serverResponse.status(StatusCodes.INTERNAL_SERVER_ERROR).send(e);
    }
  }
}
