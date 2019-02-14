import { argv } from 'yargs';
import * as config from './config';
import requestNode from './requestNode';

const startNode = async (): Promise<void> => {
  // Initialize request node instance and listen for requests
  const requestNodeInstance = new requestNode();
  await requestNodeInstance.initialize();

  const port = config.getServerPort();
  requestNodeInstance.listen(port, () => {
    const serverMessage = `Listening on port ${port}
Ethereum network id: ${config.getStorageNetworkId()}
Web3 provider url: ${config.getStorageWeb3ProviderUrl()}
IPFS host: ${config.getIpfsHost()}
IPFS port: ${config.getIpfsPort()}
IPFS protocol: ${config.getIpfsProtocol()}
IPFS timeout: ${config.getIpfsTimeout()}`;

    // tslint:disable:no-console
    console.log(serverMessage);
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
    throw error;
  });
}
