import { HardhatRuntimeEnvironmentExtended, IDeploymentParams, IDeploymentResult } from './types';
import { constants, ethers } from 'ethers';
import utils from '@requestnetwork/utils';
import { requestDeployer } from '../src/lib';

const ZERO_ETH_INPUT = 0;

export const xdeploy = async (
  deploymentParams: IDeploymentParams,
  hre: HardhatRuntimeEnvironmentExtended,
): Promise<Array<IDeploymentResult>> => {
  const { contract, constructorArgs } = deploymentParams;
  console.log(`Deployment of ${contract} through xdeployer starting now !`);

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
    let provider;
    if (network === 'celo') {
      provider = new ethers.providers.JsonRpcProvider('https://forno.celo.org');
      const originalBlockFormatter = provider.formatter._block;
      provider.formatter._block = (value: any, format: any) => {
        return originalBlockFormatter(
          {
            gasLimit: constants.Zero,
            ...value,
          },
          format,
        );
      };
    } else {
      provider = utils.getDefaultProvider(network);
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
    try {
      const createReceipt = await (
        await create2Deployer.deploy(
          ZERO_ETH_INPUT,
          hre.ethers.utils.id(hre.config.xdeploy.salt),
          initcode.data,
          { gasLimit: hre.config.xdeploy.gasLimit },
        )
      ).wait();
      receipt = createReceipt;
      deployed = true;
    } catch (err) {
      error = err;
    }
    result.push({
      network,
      contract: contract,
      address: computedContractAddress,
      receipt,
      deployed,
      error,
    });
  }
  return result;
};
