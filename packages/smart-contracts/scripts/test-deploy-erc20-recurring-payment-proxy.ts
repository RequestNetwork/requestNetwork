import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { deployOne } from './deploy-one';

export async function deployERC20RecurringPaymentProxy(
  args: any,
  hre: HardhatRuntimeEnvironment,
  erc20FeeProxyAddress: string,
) {
  try {
    const [deployer] = await hre.ethers.getSigners();
    const { address: ERC20RecurringPaymentProxyAddress } = await deployOne(
      args,
      hre,
      'ERC20RecurringPaymentProxy',
      {
        constructorArguments: [deployer.address, deployer.address, erc20FeeProxyAddress],
      },
    );

    console.log(
      `ERC20RecurringPaymentProxy Contract deployed: ${ERC20RecurringPaymentProxyAddress}`,
    );
  } catch (e) {
    console.error(e);
  }
}
