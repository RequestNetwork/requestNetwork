import { Contract } from 'ethers';
import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { ContractArtifact } from '../src/lib';

export async function deployOne(
  args: any,
  hre: HardhatRuntimeEnvironment,
  contractName: string,
  constructorParams?: any[],
  artifact?: ContractArtifact<Contract>,
) {
  const [deployer] = await hre.ethers.getSigners();
  let instanceAddress: string | undefined = undefined;
  if (artifact) {
    try {
      instanceAddress = artifact.getAddress(hre.network.name);
      const action = args.force ? '(forcing deployment)' : '(skipping)';
      console.log(`${contractName} should exist at address: ${instanceAddress} ${action}`);
      if (!args.force) {
        return instanceAddress;
      }
    } catch (e) {}
  }

  const factory = await hre.ethers.getContractFactory(contractName, deployer);
  const mainInstance = await factory.deploy(...(constructorParams || []));

  await mainInstance.deployed();
  instanceAddress = mainInstance.address;

  return instanceAddress;
}
