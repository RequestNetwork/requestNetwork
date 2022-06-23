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
    console.log('start BatchConversionPayments');
    const _chainlinkConversionPath = '0x4e71920b7330515faf5EA0c690f1aD06a85fB60c';
    const _paymentErc20ConversionFeeProxy = '0xdE5491f774F0Cb009ABcEA7326342E105dbb1B2E';

    // Deploy BatchConversionPayments contract
    const { address: BatchConversionPaymentsAddress } = await deployOne(
      args,
      hre,
      'BatchConversionPayments',
      {
        constructorArguments: [
          _paymentErc20ConversionFeeProxy,
          _chainlinkConversionPath,
          await (await hre.ethers.getSigners())[0].getAddress(),
        ],
      },
    );

    // Initialize batch conversion fee, useful to others packages.
    const [owner] = await hre.ethers.getSigners();
    const batchConversion = batchConversionPaymentsArtifact.connect(hre.network.name, owner);
    await batchConversion.connect(owner).setBatchConversionFee(10);

    // ----------------------------------
    console.log('Contracts deployed');
    console.log(`
      BatchConversionPayments:            ${BatchConversionPaymentsAddress}
    `);
  } catch (e) {
    console.error(e);
  }
}
