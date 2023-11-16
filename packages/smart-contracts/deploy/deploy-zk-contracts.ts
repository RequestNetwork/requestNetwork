import { deployContract } from './utils';

// An example of a basic deploy script
// It will deploy a Greeter contract to selected network
// as well as verify it on Block Explorer if possible for the network
export default async function () {
  const contractsToDeploy = ['ERC20FeeProxy', 'EthereumFeeProxy'];
  for (let index = 0; index < contractsToDeploy.length; index++) {
    const contractArtifactName = contractsToDeploy[index];
    console.log(`Deploying ${contractArtifactName} to zkSync ...`);
    await deployContract(contractArtifactName);
  }
}
