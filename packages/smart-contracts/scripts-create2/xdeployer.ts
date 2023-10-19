import { HardhatRuntimeEnvironmentExtended, IDeploymentParams, IDeploymentResult } from './types';
import { requestDeployer } from '../src/lib';
import { Overrides } from 'ethers';
import {
  normalizeGasFees,
  getCeloProvider,
  getDefaultProvider,
  isEip1559Supported,
} from '@requestnetwork/utils';
import { suggestFeesEip1559 } from './fee-suggestion';

const ZERO_ETH_INPUT = 0;

export const xdeploy = async (
  deploymentParams: IDeploymentParams,
  hre: HardhatRuntimeEnvironmentExtended,
): Promise<Array<IDeploymentResult>> => {
  const { contract, constructorArgs } = deploymentParams;
  console.log(
    `Deployment of ${contract} through xdeployer starting now, with ${
      new hre.ethers.Wallet(hre.config.xdeploy.signer).address
    }`,
  );

  await hre.run('compile');

  if (!hre.config.xdeploy.networks) {
    throw new Error('Bad network configuration');
  }

  if (!hre.config.xdeploy.salt) {
    throw new Error('Missing salt');
  }

  if (!hre.config.xdeploy.deployerAddress) {
    throw new Error('Missing deployer address');
  }

  const result: Array<IDeploymentResult> = [];
  let initcode: any;

  const Contract = await hre.ethers.getContractFactory(contract);
  if (constructorArgs && contract) {
    initcode = await Contract.getDeployTransaction(...constructorArgs);
  } else if (!constructorArgs && contract) {
    initcode = await Contract.getDeployTransaction();
  }

  for (const network of hre.config.xdeploy.networks) {
    console.log(`... on ${network}`);
    let provider;
    if (network === 'celo') {
      provider = getCeloProvider();
    } else {
      provider = getDefaultProvider(network);
    }
    const wallet = new hre.ethers.Wallet(hre.config.xdeploy.signer, provider);
    const signer = wallet.connect(provider);

    let computedContractAddress: string;
    const create2Deployer = new hre.ethers.Contract(
      hre.config.xdeploy.deployerAddress,
      requestDeployer.getContractAbi(),
      signer,
    );
    try {
      computedContractAddress = await create2Deployer.computeAddress(
        hre.ethers.utils.id(hre.config.xdeploy.salt),
        hre.ethers.utils.keccak256(initcode.data),
      );
    } catch (err) {
      throw new Error(
        'Contract address could not be computed, check your contract name and arguments',
      );
    }

    let receipt = undefined;
    let deployed = false;
    let error = undefined;
    let txOverrides: Overrides = {};

    if (await isEip1559Supported(provider, console)) {
      txOverrides = await normalizeGasFees({
        logger: console,
        suggestFees: suggestFeesEip1559(provider),
      });
    }
    txOverrides.gasLimit = hre.config.xdeploy.gasLimit;

    try {
      const createReceipt = await (
        await create2Deployer.deploy(
          ZERO_ETH_INPUT,
          hre.ethers.utils.id(hre.config.xdeploy.salt),
          initcode.data,
          txOverrides,
        )
      ).wait();
      receipt = createReceipt;
      deployed = true;
    } catch (err) {
      error = err;
    }
    result.push({
      network,
      contract,
      address: computedContractAddress,
      receipt,
      deployed,
      error,
    });
  }
  return result;
};
