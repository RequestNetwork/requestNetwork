import '@nomiclabs/hardhat-ethers';
import { Contract } from 'ethers';
import { ethers } from 'hardhat';

export interface DeploymentResult<TContract extends Contract | unknown = Contract> {
  address: string;
  contractName: string;
  instance: TContract;
  constructorArguments: any[];
  type: 'simulated' | 'deployed' | 'attached' | 'skipped';
  verificationPromise?: Promise<boolean>;
  block?: number;
}

/**
 * Deploys contracts if they are not known by artifacts on the network.
 * Publishes the source when the deployment is made.
 * @options
 *  - options.verify: set false to prevent verification on live networks
 *  - options.nonceCondition: only proceeds with the deployment if the nonce matches
 *  - options.version: to deploy or map a version different from the last version
 * @returns a deployment result with address =
 *  - The address if the contract is deployed or attached
 *  - 'simulated' if args.simulate === true (no deployment/)
 *  - 'skipped' if the nonce condition is not met
 */
export async function deployOne<TContract extends Contract>(
  contractName: string,
  options?: {
    constructorArguments?: any[];
    version?: string;
  },
): Promise<DeploymentResult<TContract>> {
  const [deployer] = await ethers.getSigners();
  let address: string | undefined = undefined;
  const factory = await ethers.getContractFactory(contractName, deployer);
  const constructorArguments = options?.constructorArguments ?? [];

  // Deployment
  try {
    // Deployment
    const instance = (await factory.deploy(...constructorArguments)) as TContract;
    await instance.deployed();
    address = instance.address;
    const block = instance.deployTransaction.blockNumber;

    return {
      address,
      block,
      contractName,
      instance,
      constructorArguments,
      type: 'deployed',
    };
  } catch (e) {
    throw new Error(`Failed deploying contract: ${contractName}. Error: ${e}`);
  }
}
