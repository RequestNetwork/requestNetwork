import '@nomiclabs/hardhat-ethers';
import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { Contract } from 'ethers';
import { ContractArtifact } from '../src/lib';
import { EVM } from '@requestnetwork/currency';

export interface DeploymentResult<TContract extends Contract | unknown = Contract> {
  address: string;
  contractName: string;
  instance: TContract;
  constructorArguments: any[];
  type: 'simulated' | 'deployed' | 'attached' | 'skipped';
  verificationPromise?: Promise<boolean>;
  block?: number;
}

const SIMULATED_DEPLOYMENT: DeploymentResult<unknown> = {
  address: 'simulated',
  contractName: '',
  instance: null,
  constructorArguments: [],
  type: 'simulated',
};

const SKIPPED_DEPLOYMENT: DeploymentResult<unknown> = {
  address: 'skipped',
  contractName: '',
  instance: null,
  constructorArguments: [],
  type: 'skipped',
};

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
  args: any,
  hre: HardhatRuntimeEnvironment,
  contractName: string,
  options?: {
    constructorArguments?: any[];
    artifact?: ContractArtifact<Contract>;
    verify?: boolean;
    nonceCondition?: number;
    version?: string;
  },
): Promise<DeploymentResult<TContract>> {
  const [deployer] = await hre.ethers.getSigners();
  let address: string | undefined = undefined;
  const factory = await hre.ethers.getContractFactory(contractName, deployer);
  const constructorArguments = options?.constructorArguments ?? [];
  if (options?.artifact) {
    try {
      const chain = hre.network.name;
      EVM.assertChainSupported(chain);
      address = options.artifact.getAddress(chain, options.version);
      const action = args.force ? '(forcing deployment)' : '(skipping)';
      console.log(
        `Found ${contractName}${options.version ? ` v${options.version}` : ''} on ${
          hre.network.name
        } at address: ${address} ${action}`,
      );
      if (!args.force) {
        return {
          address,
          contractName,
          instance: factory.attach(address) as TContract,
          constructorArguments,
          type: 'attached',
        };
      }
    } catch (e) {
      // ignore error
    }
  }

  if (options?.nonceCondition) {
    const currentNonce = await deployer.getTransactionCount();
    if (options.nonceCondition !== currentNonce) {
      if (!args.simulate) {
        console.warn(
          `Warning: trying to deploy ${contractName} with nonce ${options.nonceCondition}, but nonce = ${currentNonce}`,
        );
        const result: DeploymentResult<any> = {
          ...SKIPPED_DEPLOYMENT,
          instance: null,
          contractName,
          constructorArguments: constructorArguments,
        };
        return result;
      }
    }
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
    const block = instance.deployTransaction.blockNumber;

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
      block,
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
