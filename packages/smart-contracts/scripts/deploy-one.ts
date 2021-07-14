import { Contract } from 'ethers';
import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { ContractArtifact } from '..';

export async function deploy(
  args: any,
  hre: HardhatRuntimeEnvironment,
  artifact: ContractArtifact<Contract>,
  contractName: string,
  constructorParams?: any[],
) {
  const [deployer] = await hre.ethers.getSigners();

  console.log(
    `Deploying ${contractName} with the account: ${deployer.address} on the network ${hre.network.name} (${hre.network.config.chainId})`,
  );

  let instanceAddress: string | undefined = undefined;
  try {
    instanceAddress = artifact.getDeploymentInformation(hre.network.name, '0.1.0').address;
    const action = args.force ? '(forcing deployment)' : '(skipping)';
    console.log(`${contractName} already deployed at address: ${instanceAddress} ${action}`);
    if (!args.force) {
      console.log('Done\r\n');
      return instanceAddress;
    }
  } catch (e) {}

  const mainFactory = await hre.ethers.getContractFactory(contractName);

  let mainInstance: Contract;
  if (constructorParams) {
    console.log(`Deployment in progress with params ${constructorParams.join(', ')}...`);
    mainInstance = await mainFactory.deploy(...constructorParams);
  } else {
    console.log(`Deployment in progress with no param...`);
    mainInstance = await mainFactory.deploy();
  }

  await mainInstance.deployed();
  instanceAddress = mainInstance.address;

  console.log(`${contractName} deployed at address: ${instanceAddress}`);
  console.log('Done\r\n');
  return instanceAddress;
}
