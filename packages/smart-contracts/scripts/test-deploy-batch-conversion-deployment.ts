import '@nomiclabs/hardhat-ethers';
import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { deployOne } from './deploy-one';

import { batchConversionPaymentsArtifact } from '../src/lib';

// Deploys, set up the contracts
export async function deployBatchConversionPayment(
  args: any,
  hre: HardhatRuntimeEnvironment,
): Promise<any> {
  try {
    //replace by erc20feeproxy const ERC20FeeProxyAddress = '0x75c35C980C0d37ef46DF04d31A140b65503c0eEd';

    // Deploy BatchPayments contract
    const { address: BatchConversionPaymentsAddress } = await deployOne(
      args,
      hre,
      'BatchPayments',
      {
        constructorArguments: [
          // !!= ERC20FeeProxyAddress,
          await (await hre.ethers.getSigners())[0].getAddress(),
        ],
      },
    );

    // Initialize batch fee, useful to others packages.
    const [owner] = await hre.ethers.getSigners();
    const batch = batchConversionPaymentsArtifact.connect(hre.network.name, owner);
    await batch.connect(owner).setBatchConversionFee(10);

    // ----------------------------------
    console.log('Contracts deployed');
    console.log(`
      BatchConversionPayments:            ${BatchConversionPaymentsAddress}
    `);
  } catch (e) {
    console.error(e);
  }
}
