import { deployContract } from './utils';

// An example of a basic deploy script
// It will deploy a Greeter contract to selected network
// as well as verify it on Block Explorer if possible for the network
export default async function () {
  const deployList: string[] = ['ERC20FeeProxy', 'EthereumFeeProxy'];

  for (let index = 0; index < deployList.length; index++) {
    const contractName = deployList[index];
    console.log(`Deploying ${contractName} to zkSync ...`);
    await deployContract(contractName, []);
  }
}
