import { deployContract } from './utils-zk';

/**
 * Deploys Proxy contracts to zkSync network.
 * This script is supposed to be run with the deploy-zksync plugin
 * check zkSync section in smart-contracts/README file
 */
export default async function () {
  const deployList: string[] = ['ERC20FeeProxy', 'EthereumFeeProxy'];

  for (let index = 0; index < deployList.length; index++) {
    const contractName = deployList[index];
    console.log(`Deploying ${contractName} to zkSync ...`);
    await deployContract(contractName, []);
  }
}
