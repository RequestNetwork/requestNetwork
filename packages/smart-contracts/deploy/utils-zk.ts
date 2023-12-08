import { Provider, Wallet, Contract } from 'zksync-web3';
import * as hre from 'hardhat';
import { Deployer } from '@matterlabs/hardhat-zksync-deploy';
import { formatEther } from 'ethers/lib/utils';
import { BigNumberish } from 'ethers';

import { config } from 'dotenv';
import { networkRpcs } from '@requestnetwork/utils';

config();

const accounts = process.env.DEPLOYMENT_PRIVATE_KEY
  ? [process.env.DEPLOYMENT_PRIVATE_KEY]
  : process.env.DEPLOYER_MASTER_KEY
  ? [process.env.DEPLOYER_MASTER_KEY]
  : process.env.ADMIN_PRIVATE_KEY
  ? [process.env.ADMIN_PRIVATE_KEY]
  : undefined;

const WALLET_PRIVATE_KEY = (accounts || [])[0];

export const getProvider = () => {
  const rpcUrl = networkRpcs[hre.network.name];
  if (!rpcUrl)
    throw `⛔️ RPC URL wasn't found in "${hre.network.name}"! Please add a "url" field to the network config in hardhat.config.ts`;

  // Initialize zkSync Provider
  const provider = new Provider(rpcUrl);

  return provider;
};

export const getWallet = (privateKey?: string): Wallet => {
  if (!privateKey) {
    // Get wallet private key from .env file
    if (!WALLET_PRIVATE_KEY) throw "⛔️ Wallet private key wasn't found in .env file!";
  }

  const provider = getProvider();

  // Initialize zkSync Wallet
  const wallet = new Wallet(privateKey ?? WALLET_PRIVATE_KEY!, provider);

  return wallet;
};

export const verifyEnoughBalance = async (wallet: Wallet, amount: BigNumberish) => {
  // Check if the wallet has enough balance
  const balance = await wallet.getBalance();
  if (balance.lt(amount))
    throw `⛔️ Wallet balance is too low! Required ${formatEther(amount)} ETH, but current ${
      wallet.address
    } balance is ${formatEther(balance)} ETH`;
};

/**
 * @param {string} data.contract The contract's path and name. E.g., "contracts/Greeter.sol:Greeter"
 */
export const verifyContract = async (data: {
  address: string;
  contract: string;
  constructorArguments: string | [];
  bytecode: string;
}) => {
  const verificationRequestId: number = await hre.run('verify:verify', {
    ...data,
    noCompile: true,
  });
  return verificationRequestId;
};

type DeployContractOptions = {
  /**
   * If true, the deployment process will not print any logs
   */
  silent?: boolean;
  /**
   * If true, the contract will not be verified on Block Explorer
   */
  noVerify?: boolean;
  /**
   * If specified, the contract will be deployed using this wallet
   */
  wallet?: Wallet;
};

export const verifyContractByName = async (
  contractArtifactName: string,
  contractAddress: string,
) => {
  const wallet = getWallet();
  const deployer = new Deployer(hre, wallet);

  const artifact = await deployer.loadArtifact(contractArtifactName).catch((error) => {
    if (error?.message?.includes(`Artifact for contract "${contractArtifactName}" not found.`)) {
      console.error(error.message);
      throw `⛔️ Please make sure you have compiled your contracts or specified the correct contract name!`;
    } else {
      throw error;
    }
  });

  const fullContractSource = `${artifact.sourceName}:${artifact.contractName}`;

  // Display contract deployment info
  console.log(`\n"${artifact.contractName}" was successfully deployed:`);
  console.log(` - Contract address: ${contractAddress}`);
  console.log(` - Contract source: ${fullContractSource}`);

  console.log(`Requesting contract verification...`);
  await verifyContract({
    address: contractAddress,
    contract: fullContractSource,
    constructorArguments: [],
    bytecode: artifact.bytecode,
  });
};

export const deployContract = async (
  contractArtifactName: string,
  constructorArguments?: any[],
  options?: DeployContractOptions,
): Promise<Contract> => {
  const log = (message: string) => {
    if (!options?.silent) console.log(message);
  };

  log(`\nStarting deployment process of "${contractArtifactName}"...`);

  const wallet = options?.wallet ?? getWallet();
  const deployer = new Deployer(hre, wallet);

  const artifact = await deployer.loadArtifact(contractArtifactName).catch((error) => {
    if (error?.message?.includes(`Artifact for contract "${contractArtifactName}" not found.`)) {
      console.error(error.message);
      throw `⛔️ Please make sure you have compiled your contracts or specified the correct contract name!`;
    } else {
      throw error;
    }
  });

  // Estimate contract deployment fee
  const deploymentFee = await deployer.estimateDeployFee(artifact, constructorArguments || []);
  log(`Estimated deployment cost: ${formatEther(deploymentFee)} ETH`);

  // Check if the wallet has enough balance
  await verifyEnoughBalance(wallet, deploymentFee);

  // Deploy the contract to zkSync
  const contract = await deployer.deploy(artifact, constructorArguments);

  const constructorArgs = contract.interface.encodeDeploy(constructorArguments);
  const fullContractSource = `${artifact.sourceName}:${artifact.contractName}`;

  // Display contract deployment info
  log(`\n"${artifact.contractName}" was successfully deployed:`);
  log(` - Contract address: ${contract.address}`);
  log(` - Contract source: ${fullContractSource}`);
  log(` - Encoded constructor arguments: ${constructorArgs}\n`);

  if (!options?.noVerify && hre.network.config.verifyURL) {
    log(`Requesting contract verification...`);
    await verifyContract({
      address: contract.address,
      contract: fullContractSource,
      constructorArguments: constructorArgs,
      bytecode: artifact.bytecode,
    });
  }

  return contract;
};
