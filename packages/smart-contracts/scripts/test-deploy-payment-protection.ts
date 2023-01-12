import '@nomiclabs/hardhat-ethers';
import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { deployOne } from '../scripts/deploy-one';

// Deploys, set up the contracts
export default async function deployPaymentProtection(
  args: any,
  hre: HardhatRuntimeEnvironment,
): Promise<any> {
  try {
    const instancePaymentProtectionProxy = await deployOne(args, hre, 'PaymentProtectionProxy');
    console.log('ERC20Proxy Contract deployed: ' + instancePaymentProtectionProxy.address);
  } catch (err) {
    console.log(err);
  }
}
