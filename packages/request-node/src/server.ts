import * as config from './config';
import { Logger } from './logger';
import withShutdown from 'http-shutdown';
import { RequestNode } from './requestNode';
import { getDataAccess } from './dataAccess';
import { getDataStorage } from './dataStorage';
import ConfirmedTransactionStore from './request/confirmedTransactionStore';
import { SubgraphClient } from '@requestnetwork/thegraph-data-access';
import { getChain } from './chain';

// Initialize the node logger
const logger = new Logger(config.getLogLevel(), config.getLogMode());

export const getRequestNode = (): RequestNode => {
  const storage = getDataStorage(logger);
  const chain = getChain();
  const dataAccess = getDataAccess(chain, storage, logger);

  // we access the subgraph client directly, not through the data access,
  // because this feature is specific to RN use with Request Node. Without a node,
  // the confirmation process would be different, so this doesn't fit in the data access layer
  const confirmedTransactionStore = new ConfirmedTransactionStore(
    new SubgraphClient(config.getGraphNodeUrl()),
    chain.name,
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
