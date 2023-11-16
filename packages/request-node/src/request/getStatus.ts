import { DataAccessTypes, LogTypes } from '@requestnetwork/types';
import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import * as config from '../config';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const packageJson = require('../../package.json');

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
    if (!this.dataAccess._getStatus) {
      serverResponse
        .status(StatusCodes.INTERNAL_SERVER_ERROR)
        .send('The node do not support this feature');
      return;
    }

    try {
      const dataAccessStatus = await this.dataAccess._getStatus();
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
          ethereum: {
            networkId: config.getStorageNetworkId(),
            providerUrl,
            blockConfirmations: config.getBlockConfirmations(),
          },
          ipfs: {
            url: config.getIpfsUrl(),
            timeout: config.getIpfsTimeout(),
          },
          persistTransactionTimeout: config.getPersistTransactionTimeout(),
          port: config.getServerPort(),
          version: packageJson.version,
        },
      };

      serverResponse.status(StatusCodes.OK).send(status);
    } catch (e) {
      this.logger.error(`getStatus error: ${e}`);

      serverResponse.status(StatusCodes.INTERNAL_SERVER_ERROR).send(e);
    }
  }
}
