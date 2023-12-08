import * as config from './config';
import { Logger } from './logger';
import withShutdown from 'http-shutdown';
import { RequestNode } from './requestNode';
import { getDataAccess } from './dataAccess';
import { getDataStorage } from './dataStorage';
import ConfirmedTransactionStore from './request/confirmedTransactionStore';
import { EvmChains } from '@requestnetwork/currency';
import { getEthereumStorageNetworkNameFromId } from '@requestnetwork/ethereum-storage';
import { SubgraphClient } from '@requestnetwork/thegraph-data-access';

// Initialize the node logger
const logger = new Logger(config.getLogLevel(), config.getLogMode());

const getNetwork = () => {
  const network = getEthereumStorageNetworkNameFromId(config.getStorageNetworkId()) as any;
  if (!network) {
    throw new Error(`Storage network not supported: ${config.getStorageNetworkId()}`);
  }
  EvmChains.assertChainSupported(network);
  return network;
};

export const getRequestNode = (): RequestNode => {
  const network = getNetwork();
  const storage = getDataStorage(logger);
  const dataAccess = getDataAccess(network, storage, logger);

  // the confirmed transaction feature is specific to usage with a Request Node, so isn't exposed by dataAccess.
  const confirmedTransactionStore = new ConfirmedTransactionStore(
    new SubgraphClient(config.getGraphNodeUrl()),
    network,
  );

  return new RequestNode(dataAccess, storage, confirmedTransactionStore, logger);
};

export const startNode = async (): Promise<void> => {
  const port = config.getServerPort();
  const requestNode = getRequestNode();
  const server = withShutdown(
    requestNode.listen(port, () => {
      logger.info(`Listening on port ${port}`);
      return 0;
    }),
  );

  process.on('SIGTERM', async () => {
    await requestNode.close();
    logger.info('Synchronization stopped');
    await new Promise((r) => server.shutdown(r));
    logger.info('Server stopped');
    process.exit(0);
  });

  await requestNode.initialize();
};
