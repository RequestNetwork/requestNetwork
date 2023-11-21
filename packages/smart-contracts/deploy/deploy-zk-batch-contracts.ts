import { erc20FeeProxyArtifact, ethereumFeeProxyArtifact } from '../src/lib';
import { deployContract } from './utils-zk';
import * as hre from 'hardhat';
import { VMChainName } from 'types/dist/currency-types';

// An example of a basic deploy script
// It will deploy a Greeter contract to selected network
// as well as verify it on Block Explorer if possible for the network
export default async function () {
  const [deployer] = await hre.ethers.getSigners();
  const constructorArguments = [
    erc20FeeProxyArtifact.getAddress(hre.network.name as VMChainName),
    ethereumFeeProxyArtifact.getAddress(hre.network.name as VMChainName),
    hre.ethers.constants.AddressZero,
    hre.ethers.constants.AddressZero,
    hre.ethers.constants.AddressZero,
    deployer.address,
  ];
  console.log(`Deploying BatchConversionPayments to zkSync ...`);
  await deployContract('BatchConversionPayments', constructorArguments);
}
