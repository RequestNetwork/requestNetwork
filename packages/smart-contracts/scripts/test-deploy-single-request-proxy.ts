import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { deployOne } from './deploy-one';

interface FeeProxyAddresses {
  ERC20FeeProxyAddress: string;
  ETHFeeProxyAddress: string;
}

export async function deploySingleRequestProxyFactory(
  args: any,
  hre: HardhatRuntimeEnvironment,
  feeProxyAddresses: FeeProxyAddresses,
) {
  try {
    const [deployer] = await hre.ethers.getSigners();
    const { address: SingleRequestProxyFactoryAddress } = await deployOne(
      args,
      hre,
      'SingleRequestProxyFactory',
      {
        constructorArguments: [
          feeProxyAddresses.ETHFeeProxyAddress,
          feeProxyAddresses.ERC20FeeProxyAddress,
          deployer.address,
        ],
      },
    );

    console.log(`SingleRequestProxyFactory Contract deployed: ${SingleRequestProxyFactoryAddress}`);
  } catch (e) {
    console.error(e);
  }
}
