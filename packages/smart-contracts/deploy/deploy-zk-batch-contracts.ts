import { erc20FeeProxyArtifact, ethereumFeeProxyArtifact } from '../src/lib';
import { deployContract } from './utils-zk';
import * as hre from 'hardhat';

/**
 * Deploys Batch payments contracts to zkSync network.
 * This script is supposed to be run with the deploy-zksync plugin
 * check zkSync section in smart-contracts/README file
 */
export default async function () {
  const [deployer] = await hre.ethers.getSigners();
  const constructorArguments = [
    erc20FeeProxyArtifact.getAddress(hre.network.name),
    ethereumFeeProxyArtifact.getAddress(hre.network.name),
    hre.ethers.constants.AddressZero,
    hre.ethers.constants.AddressZero,
    hre.ethers.constants.AddressZero,
    deployer.address,
  ];
  console.log(`Deploying BatchConversionPayments to zkSync ...`);
  await deployContract('BatchConversionPayments', constructorArguments);
}
