#!/usr/bin/env node
import { LogTypes } from '@requestnetwork/types';
import { argv } from 'yargs';
import * as config from './config';
import { Logger } from './logger';
import { RequestNode } from './requestNode';
import withShutdown from 'http-shutdown';
import { TheGraphRequestNode } from './thegraph';

// Initialize the node logger
const { logLevel, logMode } = config.getLogConfig();
const logger = new Logger(logLevel, logMode);

const startNode = async (): Promise<void> => {
  const serverMessage = `Using config:
  Ethereum network id: ${config.getStorageNetworkId()}
  Log Level: ${LogTypes.LogLevel[config.getLogConfig().logLevel]}
  Log Mode: ${config.getLogConfig().logMode}
  Web3 provider url: ${config.getStorageWeb3ProviderUrl()}
  TheGraph url: ${config.getGraphNodeUrl()}
  IPFS host: ${config.getIpfsHost()}
  IPFS port: ${config.getIpfsPort()}
  IPFS protocol: ${config.getIpfsProtocol()}
  IPFS timeout: ${config.getIpfsTimeout()}
  Storage concurrency: ${config.getStorageConcurrency()}
  Initialization storage path: ${config.getInitializationStorageFilePath()}
`;

  logger.info(serverMessage);

  const port = config.getServerPort();
  const graphNodeUrl = config.getGraphNodeUrl();
  const requestNode = graphNodeUrl
    ? new TheGraphRequestNode(graphNodeUrl, logger)
    : new RequestNode(logger);
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

// If -h option is used, commands are printed
// Otherwise the node is started
if (argv.h) {
  /* eslint-disable no-console */
  console.log(config.getHelpMessage());
} else {
  startNode().catch((error) => {
    logger.error(error);
    process.exit(1);
  });
}
