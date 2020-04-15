import { DataAccess } from '@requestnetwork/data-access';
import { LogTypes } from '@requestnetwork/types';
import * as httpStatus from 'http-status-codes';
import * as config from '../config';

const packageJson = require('../../package.json');

const GET_CHANNELS_TIMEOUT: number = 600000;

/**
 * Handles getStatus of data-access layer.
 *
 * @param clientRequest http client request object
 * @param serverResponse http server response object
 * @param dataAccess data access layer
 */
export default async function getStatus(
  clientRequest: any,
  serverResponse: any,
  dataAccess: DataAccess,
  logger: LogTypes.ILogger,
): Promise<void> {
  // Used to compute request time
  const requestStartTime = Date.now();

  // As the Node doesn't implement a cache, all transactions have to be retrieved directly on IPFS
  // This operation can take a long time and then the timeout of the request should be increase
  // PROT-187: Decrease or remove this value
  clientRequest.setTimeout(GET_CHANNELS_TIMEOUT);

  if (!dataAccess._getStatus) {
    return serverResponse
      .status(httpStatus.INTERNAL_SERVER_ERROR)
      .send('The node do not support this feature');
  }

  try {
    const dataAccessStatus = await dataAccess._getStatus(clientRequest.query.detailed);
    let providerUrl: string = '';

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
    logger.debug(`getStatus latency: ${requestEndTime - requestStartTime}ms`, [
      'metric',
      'latency',
    ]);

    serverResponse.status(httpStatus.OK).send(status);
  } catch (e) {
    logger.error(`getStatus error: ${e}`);

    serverResponse.status(httpStatus.INTERNAL_SERVER_ERROR).send(e);
  }
}
