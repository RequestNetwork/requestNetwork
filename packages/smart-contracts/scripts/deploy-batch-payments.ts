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

    // Deploy BatchPayment contract
    const { address: BatchPaymentsAddress } = await deployOne(args, hre, 'BatchPayments');
    console.log('BatchPayments Contract deployed: ' + BatchPaymentsAddress);

    // ----------------------------------
    console.log('Contracts deployed');
    console.log(`
      BatchPaymentsAddress: ${BatchPaymentsAddress}
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
