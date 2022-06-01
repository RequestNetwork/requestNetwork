import '@nomiclabs/hardhat-ethers';
import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { deployOne } from './deploy-one';

import { batchConversionPaymentsArtifact } from '../src/lib';
import { chainlinkConversionPath as chainlinkConvArtifact } from '../src/lib';
import { CurrencyManager } from '@requestnetwork/currency';

// Deploys, set up the contracts
export async function deployBatchConversionPayment(
  args: any,
  hre: HardhatRuntimeEnvironment,
): Promise<any> {
  try {
    console.log('start BatchConversionPayments');
    const _ERC20FeeProxyAddress = '0x75c35C980C0d37ef46DF04d31A140b65503c0eEd';
    const _EthereumFeeProxyAddress = '0x3d49d1eF2adE060a33c6E6Aa213513A7EE9a6241';
    const _chainlinkConversionPath = '0x4e71920b7330515faf5EA0c690f1aD06a85fB60c';
    const _paymentErc20ConversionFeeProxy = '0xdE5491f774F0Cb009ABcEA7326342E105dbb1B2E';

    // Deploy BatchConversionPayments contract
    const { address: BatchConversionPaymentsAddress } = await deployOne(
      args,
      hre,
      'BatchConversionPayments',
      {
        constructorArguments: [
          _ERC20FeeProxyAddress,
          _EthereumFeeProxyAddress,
          _paymentErc20ConversionFeeProxy,
          _chainlinkConversionPath,
          await (await hre.ethers.getSigners())[0].getAddress(),
        ],
      },
    );

    // Initialize batch conversion fee, useful to others packages.
    const [owner] = await hre.ethers.getSigners();
    const batchConversion = batchConversionPaymentsArtifact.connect(hre.network.name, owner);
    await batchConversion.connect(owner).setBasicFee(10);
    await batchConversion.connect(owner).setBatchFee(30);
    await batchConversion.connect(owner).setBatchConversionFee(30);

    // Add a second ERC20 token and aggregator - useful for batch test
    const erc20Factory = await hre.ethers.getContractFactory('TestERC20');
    const testERC20FakeFAU = await erc20Factory.deploy('1000000000000000000000000000000');
    const { address: AggFakeFAU_USD_address } = await deployOne(args, hre, 'AggregatorMock', {
      constructorArguments: [201000000, 8, 60],
    });
    const conversionPathInstance = chainlinkConvArtifact.connect('private', owner);
    const currencyManager = CurrencyManager.getDefault();
    const USD_hash = currencyManager.fromSymbol('USD')!.hash;
    await conversionPathInstance.updateAggregatorsList(
      [testERC20FakeFAU.address],
      [USD_hash],
      [AggFakeFAU_USD_address],
    );

    // ----------------------------------
    console.log('Contracts deployed');
    console.log(`
      testERC20FakeFAU.address:                 ${testERC20FakeFAU.address}
      BatchConversionPayments:            ${BatchConversionPaymentsAddress}
    `);
  } catch (e) {
    console.error(e);
  }
}
