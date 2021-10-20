import '@nomiclabs/hardhat-ethers';
import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { Contract } from 'ethers';
import { ContractArtifact } from '../src/lib';

export type DeploymentResult =
  | {
      address: string;
      contractName: string;
      instance: Contract;
      constructorArguments: any[];
      type: 'deployed' | 'attached';
      verificationPromise?: Promise<boolean>;
    }
  | {
      address: 'simulated';
      contractName: string;
      instance: null;
      constructorArguments: any[];
      type: 'simulated';
      verificationPromise: null;
    };

const SIMULATED_DEPLOYMENT: DeploymentResult = {
  address: 'simulated',
  contractName: '',
  instance: null,
  constructorArguments: [],
  type: 'simulated',
  verificationPromise: null,
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
export async function deployOne(
  args: any,
  hre: HardhatRuntimeEnvironment,
  contractName: string,
  options?: {
    constructorArguments?: any[];
    artifact?: ContractArtifact<Contract>;
    verify?: boolean;
  },
): Promise<DeploymentResult> {
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
          instance: factory.attach(address),
          constructorArguments: constructorArguments,
          type: 'attached',
        };
      }
    } catch (e) {}
  }

  if (args.simulate) {
    return { ...SIMULATED_DEPLOYMENT, contractName, constructorArguments: constructorArguments };
  }

  // Deployment and Verification
  try {
    // Deployment
    const instance = await factory.deploy(...constructorArguments);
    await instance.deployed();
    address = instance.address;

    // Verfication
    let verificationPromise: Promise<boolean> | undefined = undefined;
    const publishSource =
      hre.network.name !== 'private' && !args.simulate && options?.verify !== false;

    if (publishSource) {
      verificationPromise = instance.deployTransaction.wait(10).then(() => {
        let verificationResult = true;
        try {
          hre.run('verify:verify', { address, constructorArguments });
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
