import '@nomiclabs/hardhat-ethers';
import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { deployOne } from '../scripts/deploy-one';

// Deploys, set up the contracts
export async function deployBatchPayment(args: any, hre: HardhatRuntimeEnvironment): Promise<any> {
  try {
    const ERC20FeeProxyAddress = '0x75c35C980C0d37ef46DF04d31A140b65503c0eEd';
    const EthereumFeeProxyAddress = '0x3d49d1eF2adE060a33c6E6Aa213513A7EE9a6241';

    // Deploy BatchPayments contract
    const { address: BatchPaymentsAddress } = await deployOne(args, hre, 'BatchPayments', {
      constructorArguments: [ERC20FeeProxyAddress, EthereumFeeProxyAddress],
    });
    console.log('BatchPaymentsAddress Contract deployed: ' + BatchPaymentsAddress);

    // ----------------------------------
    console.log('Contracts deployed');
    console.log(`
      BatchPaymentsAddress:       ${BatchPaymentsAddress}
    `);
  } catch (e) {
    console.error(e);
  }
}
