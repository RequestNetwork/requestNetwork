import '@nomiclabs/hardhat-ethers';
import { CurrencyManager } from '@requestnetwork/currency';
import { HardhatRuntimeEnvironment } from 'hardhat/types';
import deployERC20ConversionProxy from './erc20-conversion-proxy';
import deployEthConversionProxy from './eth-conversion-proxy';
import deploySwapConversion from './erc20-swap-to-conversion';
import { deployOne } from './deploy-one';

export default async function deploy(args: any, hre: HardhatRuntimeEnvironment) {
  const [deployer] = await hre.ethers.getSigners();
  const AggDAI_USD_address = await deployOne(args, hre, 'AggregatorMock', [101000000, 8, 60]);
  const AggETH_USD_address = await deployOne(args, hre, 'AggregatorMock', [50000000000, 8, 60]);
  const AggEUR_USD_address = await deployOne(args, hre, 'AggregatorMock', [120000000, 8, 60]);
  const AggUSDT_ETH_address = await deployOne(args, hre, 'AggregatorMock', [2000000000000000, 18, 60]);
  const USDT_fake_address = await deployOne(args, hre, 'UsdtFake');

  const currencyManager = CurrencyManager.getDefault();
  // all these addresses are for test purposes
  const ETH_address = currencyManager.fromSymbol('ETH')!.hash;
  const USD_address = currencyManager.fromSymbol('USD')!.hash;
  const EUR_address = currencyManager.fromSymbol('EUR')!.hash;
  // Cf. ERC20Alpha in TestERC20.sol
  const DAI_address = '0x38cF23C52Bb4B13F051Aec09580a2dE845a7FA35';

  const USDT_address = USDT_fake_address;

  console.log(`USDT address: ${USDT_address}`);

  const conversionPathInstance = await (
    await hre.ethers.getContractFactory('ChainlinkConversionPath', deployer)
  ).deploy();

  // all these aggregators are for test purposes
  await conversionPathInstance.updateAggregatorsList(
    [DAI_address, EUR_address, ETH_address, USDT_address],
    [USD_address, USD_address, USD_address, ETH_address],
    [AggDAI_USD_address, AggEUR_USD_address, AggETH_USD_address, AggUSDT_ETH_address],
  );
  console.log('AggregatorsList updated.');

  // erc20SwapConversion
  const erc20ConversionAddress = await deployERC20ConversionProxy(
    {
      ...args,
      chainlinkConversionPathAddress: conversionPathInstance.address,
      erc20FeeProxyAddress: '0x75c35C980C0d37ef46DF04d31A140b65503c0eEd',
    },
    hre,
  );
  const localSwapRouterAddress = '0x4E72770760c011647D4873f60A3CF6cDeA896CD8';
  const erc20SwapConversionAddress = await deploySwapConversion(
    {
      ...args,
      conversionProxyAddress: erc20ConversionAddress,
      swapProxyAddress: localSwapRouterAddress,
    },
    hre,
  );
  const erc20SwapConversion = (
    await hre.ethers.getContractFactory('ERC20SwapToConversion', deployer)
  ).attach(erc20SwapConversionAddress);
  await erc20SwapConversion.approvePaymentProxyToSpend(
    // FIXME: should try to retrieve information from artifacts instead
    '0x38cF23C52Bb4B13F051Aec09580a2dE845a7FA35',
  );
  // FIXME: should try to retrieve information from artifacts instead
  await erc20SwapConversion.approveRouterToSpend('0x9FBDa871d559710256a2502A2517b794B482Db40');

  // EthConversion
  const ethConversionProxyAddress = await deployEthConversionProxy(
    {
      ...args,
      chainlinkConversionPathAddress: conversionPathInstance.address,
      ethFeeProxyAddress: '0x3d49d1eF2adE060a33c6E6Aa213513A7EE9a6241',
      nativeTokenHash: ETH_address,
    },
    hre,
  );
  // ----------------------------------
  console.log('Contracts deployed');
  console.log(`
    (fake) USDT:              ${USDT_address}
    AggDAI_USD:               ${AggDAI_USD_address}
    ChainlinkConversionPath:  ${conversionPathInstance.address}
    Erc20ConversionProxy:     ${erc20ConversionAddress}
    Erc20SwapConversionProxy: ${erc20SwapConversionAddress}
    EthConversionProxy:       ${ethConversionProxyAddress}
    `);
}
