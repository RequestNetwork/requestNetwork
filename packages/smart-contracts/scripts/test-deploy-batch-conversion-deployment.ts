import '@nomiclabs/hardhat-ethers';
import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { deployOne } from './deploy-one';

import {
  batchConversionPaymentsArtifact,
  erc20ConversionProxy,
  erc20FeeProxyArtifact,
  ethConversionArtifact,
  ethereumFeeProxyArtifact,
} from '../src/lib';
import { chainlinkConversionPath as chainlinkConvArtifact } from '../src/lib';
import { CurrencyManager } from '@requestnetwork/currency';
import { deployAddressChecking } from './utils';

export const FAU_USD_RATE = 2.01;

// Deploys, set up the contracts
export async function deployBatchConversionPayment(
  args: any,
  hre: HardhatRuntimeEnvironment,
): Promise<any> {
  try {
    console.log('start BatchConversionPayments');
    const _ERC20FeeProxyAddress = erc20FeeProxyArtifact.getAddress('private');
    const _EthereumFeeProxyAddress = ethereumFeeProxyArtifact.getAddress('private');
    const _paymentErc20ConversionFeeProxy = erc20ConversionProxy.getAddress('private');
    const _paymentEthConversionFeeProxy = ethConversionArtifact.getAddress('private');

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
          _paymentEthConversionFeeProxy,
          await (await hre.ethers.getSigners())[0].getAddress(),
        ],
      },
    );

    // Add a second ERC20 token and aggregator - useful for batch test
    console.log('start adding a second conversion path instance');
    const [owner] = await hre.ethers.getSigners();
    const erc20Factory = await hre.ethers.getContractFactory('TestERC20');
    const testERC20FakeFAU = await erc20Factory.deploy('1000000000000000000000000000000');
    const { address: AggFakeFAU_USD_address } = await deployOne(args, hre, 'AggregatorMock', {
      constructorArguments: [FAU_USD_RATE * 100000000, 8, 60],
    });
    const conversionPathInstance = chainlinkConvArtifact.connect('private', owner);
    const currencyManager = CurrencyManager.getDefault();
    const USD_hash = currencyManager.fromSymbol('USD')!.hash;
    await conversionPathInstance.updateAggregatorsList(
      [testERC20FakeFAU.address],
      [USD_hash],
      [AggFakeFAU_USD_address],
    );

    // Check the addresses of our contracts, to avoid misleading bugs in the tests
    // ref to secondLocalERC20AlphaArtifact.getAddress('private'), that cannot be used in deployment
    const fakeFAU_addressExpected = '0xe4e47451AAd6C89a6D9E4aD104A7b77FfE1D3b36';
    deployAddressChecking('testERC20FakeFAU', testERC20FakeFAU.address, fakeFAU_addressExpected);
    deployAddressChecking(
      'batchConversionPayments',
      BatchConversionPaymentsAddress,
      batchConversionPaymentsArtifact.getAddress('private'),
    );

    // Initialize batch conversion fee, useful to others packages.
    const batchConversion = batchConversionPaymentsArtifact.connect(hre.network.name, owner);
    await batchConversion.connect(owner).setBatchFee(30);
    await batchConversion.connect(owner).setBatchConversionFee(30);

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
