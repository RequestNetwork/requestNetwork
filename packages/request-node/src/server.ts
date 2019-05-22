#!/usr/bin/env node

import { argv } from 'yargs';
import * as config from './config';
import requestNode from './requestNode';

const startNode = async (): Promise<void> => {
  const serverMessage = `Using config:
  Ethereum network id: ${config.getStorageNetworkId()}
  Log Level: ${config.getLogLevel()}
  Web3 provider url: ${config.getStorageWeb3ProviderUrl()}
  IPFS host: ${config.getIpfsHost()}
  IPFS port: ${config.getIpfsPort()}
  IPFS protocol: ${config.getIpfsProtocol()}
  IPFS timeout: ${config.getIpfsTimeout()}
  Storage concurrency: ${config.getStorageConcurrency()}
`;

  // tslint:disable:no-console
  console.log(serverMessage);

  // Initialize request node instance and listen for requests
  const requestNodeInstance = new requestNode();
  await requestNodeInstance.initialize();

  const port = config.getServerPort();
  requestNodeInstance.listen(port, () => {
    // tslint:disable:no-console
    console.log(`Listening on port ${port}`);
    return 0;
  });
};

// If -h option is used, commands are printed
// Otherwise the node is started
if (argv.h) {
  // tslint:disable:no-console
  console.log(config.getHelpMessage());
} else {
  startNode().catch(error => {
    console.error(error);
    process.exit(1);
  });
}
