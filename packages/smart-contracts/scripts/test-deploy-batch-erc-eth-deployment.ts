import '@nomiclabs/hardhat-ethers';
import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { deployOne } from '../scripts/deploy-one.js';

import { batchPaymentsArtifact } from '../src/lib.js';
import { deployAddressChecking } from './utils';
import { EvmChains } from '@requestnetwork/currency';

// Deploys, set up the contracts
export async function deployBatchPayment(args: any, hre: HardhatRuntimeEnvironment): Promise<any> {
  try {
    const chain = hre.network.name;
    EvmChains.assertChainSupported(chain);
    const ERC20FeeProxyAddress = '0x75c35C980C0d37ef46DF04d31A140b65503c0eEd';
    const EthereumFeeProxyAddress = '0x3d49d1eF2adE060a33c6E6Aa213513A7EE9a6241';

    // Deploy BatchPayments contract
    const { address: BatchPaymentsAddress } = await deployOne(args, hre, 'BatchPayments', {
      constructorArguments: [
        ERC20FeeProxyAddress,
        EthereumFeeProxyAddress,
        await (await hre.ethers.getSigners())[0].getAddress(),
      ],
    });

    // Initialize batch fee, useful to others packages.
    const [owner] = await hre.ethers.getSigners();
    const batch = batchPaymentsArtifact.connect(chain, owner);
    await batch.connect(owner).setBatchFee(10);

    // ----------------------------------
    console.log('Contracts deployed');
    console.log(`
      BatchPayments:            ${BatchPaymentsAddress}
    `);

    deployAddressChecking(
      'BatchPayments',
      BatchPaymentsAddress,
      batchPaymentsArtifact.getAddress('private'),
    );
  } catch (e) {
    console.error(e);
  }
}
