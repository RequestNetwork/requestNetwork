import * as config from './config';
import { Logger } from './logger';
import withShutdown from 'http-shutdown';
import { RequestNode } from './requestNode';
import { getDataAccess } from './dataAccess';
import KeyvFile from 'keyv-file';
import { getDataStorage } from './dataStorage';

// Initialize the node logger
const logger = new Logger(config.getLogLevel(), config.getLogMode());

export const getRequestNode = (): RequestNode => {
  const initializationStoragePath = config.getInitializationStorageFilePath();
  const store = initializationStoragePath
    ? new KeyvFile({
        filename: initializationStoragePath,
      })
    : undefined;
  const storage = getDataStorage(logger);
  const dataAccess = getDataAccess(storage, logger);
  return new RequestNode(dataAccess, storage, store, logger);
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
