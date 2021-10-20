import '@nomiclabs/hardhat-ethers';
import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { Contract } from 'ethers';
import { ContractArtifact } from '../src/lib';

export interface DeploymentResult<TContract extends Contract | unknown = Contract> {
  address: string;
  contractName: string;
  instance: TContract;
  constructorArguments: any[];
  type: 'simulated' | 'deployed' | 'attached';
  verificationPromise?: Promise<boolean>;
}

const SIMULATED_DEPLOYMENT: DeploymentResult<unknown> = {
  address: 'simulated',
  contractName: '',
  instance: null,
  constructorArguments: [],
  type: 'simulated',
};

/**
 * Deploys contracts if they are not known by artifacts on the network.
 * Publishes the source when the deployment is made.
 * @options
 *  - options.verify: set false to prevent verification on live networks
 * @returns
 *  - The address if the contract is deployed
 *  - 'simulated' if args.simulate === true (no deployment/)
 */
export async function deployOne<TContract extends Contract>(
  args: any,
  hre: HardhatRuntimeEnvironment,
  contractName: string,
  options?: {
    constructorArguments?: any[];
    artifact?: ContractArtifact<Contract>;
    verify?: boolean;
  },
): Promise<DeploymentResult<TContract>> {
  const [deployer] = await hre.ethers.getSigners();
  let address: string | undefined = undefined;
  const factory = await hre.ethers.getContractFactory(contractName, deployer);
  const constructorArguments = options?.constructorArguments ?? [];
  if (options?.artifact) {
    try {
      address = options.artifact.getAddress(hre.network.name);
      const action = args.force ? '(forcing deployment)' : '(skipping)';
      console.log(`Found ${contractName} on ${hre.network.name} at address: ${address} ${action}`);
      if (!args.force) {
        return {
          address,
          contractName,
          instance: factory.attach(address) as TContract,
          constructorArguments,
          type: 'attached',
        };
      }
    } catch (e) {}
  }

  if (args.simulate) {
    const result: DeploymentResult<any> = {
      ...SIMULATED_DEPLOYMENT,
      instance: null,
      contractName,
      constructorArguments: constructorArguments,
    };
    return result;
  }

  // Deployment and Verification
  try {
    // Deployment
    const instance = (await factory.deploy(...constructorArguments)) as TContract;
    await instance.deployed();
    address = instance.address;

    // Verfication
    let verificationPromise: Promise<boolean> | undefined = undefined;
    const publishSource =
      hre.network.name !== 'private' && !args.simulate && options?.verify !== false;

    if (publishSource) {
      verificationPromise = instance.deployTransaction.wait(10).then(async () => {
        let verificationResult = true;
        try {
          await hre.run('verify:verify', { address, constructorArguments });
        } catch (e) {
          console.warn(`Failed verifying contract: ${contractName}`);
          console.log(e);
          verificationResult = false;
        }
        return verificationResult;
      });
    }

    return {
      address,
      contractName,
      instance,
      constructorArguments,
      type: 'deployed',
      verificationPromise,
    };
  } catch (e) {
    throw new Error(`Failed deploying contract: ${contractName}. Error: ${e}`);
  }
}
