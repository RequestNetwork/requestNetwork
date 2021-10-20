import '@nomiclabs/hardhat-ethers';
import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { prepareSwapConversion } from './erc20-swap-to-conversion';

// Deploys, set up the contracts
export async function preparePayments(hre: HardhatRuntimeEnvironment) {
  try {
    const [, signer] = await hre.ethers.getSigners();

    if (!signer) {
      console.error('ERROR: Need ADMIN_PRIVATE_KEY (or second signer) to do preparation tasks.');
      return;
    }

    console.log(
      `*** Preparing payments with the account: ${signer.address} on the network ${hre.network.name} (${hre.network.config.chainId}) ***`,
    );

    const nbOps = await prepareSwapConversion(hre);

    if (nbOps > 0) {
      console.log(`--- ${nbOps} preparatory tx were made. ---`);
    } else {
      console.log(`--- No preparatory tx was made. ---`);
    }
  } catch (e) {
    console.error(e);
  }
}
