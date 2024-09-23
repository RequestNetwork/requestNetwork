import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { deployOne } from './deploy-one';
import { feeProxyAddresses } from './utils';

export async function deploySingleRequestProxyFactory(
  args: any,
  hre: HardhatRuntimeEnvironment,
): Promise<void> {
  const [deployer] = await hre.ethers.getSigners();
  const networkName = hre.network.name;

  console.log(
    `Deploying with the account: ${deployer.address} on the network ${networkName} (${hre.network.config.chainId})`,
  );

  const config = feeProxyAddresses[networkName];
  if (!config) {
    throw new Error(`No configuration found for network: ${networkName}`);
  }

  const { ethereumFeeProxyAddress, erc20FeeProxyAddress } = config;

  const { address: SingleRequestProxyFactoryAddress } = await deployOne(
    args,
    hre,
    'SingleRequestProxyFactory',
    {
      constructorArguments: [ethereumFeeProxyAddress, erc20FeeProxyAddress],
    },
  );

  console.log('SingleRequestProxyFactory Contract deployed: ' + SingleRequestProxyFactoryAddress);
}
