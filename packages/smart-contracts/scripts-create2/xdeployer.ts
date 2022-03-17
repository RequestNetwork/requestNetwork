import { HardhatRuntimeEnvironmentExtended, IDeploymentParams, IDeploymentResult } from './types';
import { constants } from 'ethers';
import { requestDeployer } from '../src/lib';

const AMOUNT = 0;

export const xdeploy = async (
  deploymentParams: IDeploymentParams,
  hre: HardhatRuntimeEnvironmentExtended,
): Promise<Array<IDeploymentResult>> => {
  const { contract, constructorArgs } = deploymentParams;
  console.log(`Deployment of ${contract} through xdeployer starting now !`);

  await hre.run('compile');

  if (!hre.config.xdeploy.networks || !hre.config.xdeploy.rpcUrls) {
    throw new Error('Bad network configuration');
  }

  if (hre.config.xdeploy.networks.length !== hre.config.xdeploy.rpcUrls.length) {
    throw new Error('Number of rpc url does not match number of network');
  }

  if (!hre.config.xdeploy.salt) {
    throw new Error('Missing salt');
  }

  if (!hre.config.xdeploy.deployerAddress) {
    throw new Error('Missing deployer address');
  }

  const providers: Array<any> = [];
  const wallets: Array<any> = [];
  const signers: Array<any> = [];
  const create2Deployer: Array<any> = [];
  const createReceipt: Array<any> = [];
  const result: Array<IDeploymentResult> = [];
  let initcode: any;

  const Contract = await hre.ethers.getContractFactory(contract);
  if (constructorArgs && contract) {
    initcode = await Contract.getDeployTransaction(...constructorArgs);
  } else if (!constructorArgs && contract) {
    initcode = await Contract.getDeployTransaction();
  }

  for (let i = 0; i < hre.config.xdeploy.rpcUrls.length; i++) {
    providers[i] = new hre.ethers.providers.JsonRpcProvider(hre.config.xdeploy.rpcUrls[i]);
    if (hre.config.xdeploy.networks[i] === 'celo') {
      const originalBlockFormatter = providers[i].formatter._block;
      providers[i].formatter._block = (value: any, format: any) => {
        return originalBlockFormatter(
          {
            gasLimit: constants.Zero,
            ...value,
          },
          format,
        );
      };
    }
    wallets[i] = new hre.ethers.Wallet(hre.config.xdeploy.signer, providers[i]);
    signers[i] = wallets[i].connect(providers[i]);

    let computedContractAddress: string;
    if (
      hre.config.xdeploy.networks[i] !== 'hardhat' &&
      hre.config.xdeploy.networks[i] !== 'localhost'
    ) {
      create2Deployer[i] = new hre.ethers.Contract(
        hre.config.xdeploy.deployerAddress,
        requestDeployer.getContractAbi(),
        signers[i],
      );
      try {
        computedContractAddress = await create2Deployer[i].computeAddress(
          hre.ethers.utils.id(hre.config.xdeploy.salt),
          hre.ethers.utils.keccak256(initcode.data),
        );
      } catch (err) {
        throw new Error(
          'Contract address could not be computed, check your contract name and arguments',
        );
      }
      try {
        createReceipt[i] = await create2Deployer[i].deploy(
          AMOUNT,
          hre.ethers.utils.id(hre.config.xdeploy.salt),
          initcode.data,
          { gasLimit: hre.config.xdeploy.gasLimit },
        );

        createReceipt[i] = await createReceipt[i].wait();

        result[i] = {
          network: hre.config.xdeploy.networks[i],
          contract: contract,
          address: computedContractAddress,
          receipt: createReceipt[i],
          deployed: true,
          error: undefined,
        };
      } catch (err) {
        result[i] = {
          network: hre.config.xdeploy.networks[i],
          contract: contract,
          address: computedContractAddress,
          receipt: undefined,
          deployed: false,
          error: err,
        };
      }
    } else if (
      hre.config.xdeploy.networks[i] === 'hardhat' ||
      hre.config.xdeploy.networks[i] === 'localhost'
    ) {
      console.log('ici');
      const hhcreate2Deployer = await hre.ethers.getContractFactory('Create2DeployerLocal');
      console.log('ici');
      console.log(hhcreate2Deployer);
      create2Deployer[i] = await hhcreate2Deployer.deploy();
      console.log('ici');
      try {
        computedContractAddress = await create2Deployer[i].computeAddress(
          hre.ethers.utils.id(hre.config.xdeploy.salt),
          hre.ethers.utils.keccak256(initcode.data),
        );
      } catch (err) {
        throw new Error(
          'Contract address could not be computed, check your contract name and arguments',
        );
      }
      try {
        createReceipt[i] = await create2Deployer[i].deploy(
          AMOUNT,
          hre.ethers.utils.id(hre.config.xdeploy.salt),
          initcode.data,
          { gasLimit: hre.config.xdeploy.gasLimit },
        );

        createReceipt[i] = await createReceipt[i].wait();

        result[i] = {
          network: hre.config.xdeploy.networks[i],
          contract: contract,
          address: computedContractAddress,
          receipt: createReceipt[i],
          deployed: true,
          error: undefined,
        };
      } catch (err) {
        result[i] = {
          network: hre.config.xdeploy.networks[i],
          contract: contract,
          address: computedContractAddress,
          receipt: undefined,
          deployed: false,
          error: err,
        };
      }
    }
  }
  return result;
};
