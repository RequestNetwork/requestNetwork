import { HardhatRuntimeEnvironment } from 'hardhat/types';
import '@nomiclabs/hardhat-ethers';
import { deployOne } from '../scripts/deploy-one';

// Deploys, set up the contracts
async function deployPayment(args: any, hre: HardhatRuntimeEnvironment): Promise<any> {
  try {
    const [deployer] = await hre.ethers.getSigners();

    console.log(
      `Deploying with the account: ${deployer.address} on the network ${hre.network.name} (${hre.network.config.chainId})`,
    );

    // Deploy BatchErc20PaymentRequestsOptim contract
    const { address: BatchErc20PaymentsOptimAddress } = await deployOne(
      args,
      hre,
      'BatchErc20PaymentsOptim',
    );
    console.log('BatchErc20PaymentsOptim Contract deployed: ' + BatchErc20PaymentsOptimAddress);

    // ----------------------------------
    console.log('Contracts deployed');
    console.log(`
      BatchErc20PaymentsOptimAddress: ${BatchErc20PaymentsOptimAddress}
    `);
    return {};
  } catch (e) {
    console.error(e);
  }
}

// Deploys, set up the contracts
export default async function deployBatchPayments(_args: any, hre: HardhatRuntimeEnvironment) {
  await deployPayment(_args, hre);
}
