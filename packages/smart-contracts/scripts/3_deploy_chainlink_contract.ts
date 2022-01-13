import '@nomiclabs/hardhat-ethers';
import { CurrencyManager } from '@requestnetwork/currency';
import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { deployERC20ConversionProxy, deployETHConversionProxy } from './conversion-proxy';
import { deploySwapConversion } from './erc20-swap-to-conversion';
import { deployOne } from './deploy-one';

export default async function deploy(args: any, hre: HardhatRuntimeEnvironment, mainPaymentAddresses: any) {
  const [deployer] = await hre.ethers.getSigners();
  const { address: AggDAI_USD_address } = await deployOne(args, hre, 'AggregatorMock', {
    constructorArguments: [101000000, 8, 60],
  });
  const { address: AggETH_USD_address } = await deployOne(args, hre, 'AggregatorMock', {
    constructorArguments: [50000000000, 8, 60],
  });
  const { address: AggEUR_USD_address } = await deployOne(args, hre, 'AggregatorMock', {
    constructorArguments: [120000000, 8, 60],
  });
  const { address: AggUSDT_ETH_address } = await deployOne(args, hre, 'AggregatorMock', {
    constructorArguments: [2000000000000000, 18, 60],
  });
  const { address: USDT_fake_address } = await deployOne(args, hre, 'UsdtFake');

  const currencyManager = CurrencyManager.getDefault();
  // all these addresses are for test purposes
  const ETH_hash = currencyManager.fromSymbol('ETH')!.hash;
  const USD_hash = currencyManager.fromSymbol('USD')!.hash;
  const EUR_hash = currencyManager.fromSymbol('EUR')!.hash;

  // Cf. ERC20Alpha in TestERC20.sol
  const DAI_address = mainPaymentAddresses.DAI_address;

  const USDT_address = USDT_fake_address;

  console.log(`USDT address: ${USDT_address}`);

  const conversionPathInstance = await (
    await hre.ethers.getContractFactory('ChainlinkConversionPath', deployer)
  ).deploy();

  // all these aggregators are for test purposes
  await conversionPathInstance.updateAggregatorsList(
    [DAI_address, EUR_hash, ETH_hash, USDT_address],
    [USD_hash, USD_hash, USD_hash, ETH_hash],
    [AggDAI_USD_address, AggEUR_USD_address, AggETH_USD_address, AggUSDT_ETH_address],
  );
  console.log('AggregatorsList updated.');

  // erc20SwapConversion
  const erc20ConversionAddress = (
    await deployERC20ConversionProxy(
      {
        ...args,
        chainlinkConversionPathAddress: conversionPathInstance.address,
        erc20FeeProxyAddress: mainPaymentAddresses.ERC20FeeProxy_address,
      },
      hre,
    )
  )?.address;
  const localSwapRouterAddress = '0x4E72770760c011647D4873f60A3CF6cDeA896CD8';
  const {
    address: erc20SwapConversionAddress,
    instance: erc20SwapConversion,
  } = await deploySwapConversion(
    {
      ...args,
      conversionProxyAddress: erc20ConversionAddress,
      swapProxyAddress: localSwapRouterAddress,
    },
    hre,
  );
  if (!erc20SwapConversion) {
    console.error('Deployment for erc20SwapConversion failed.');
    return;
  }
  await erc20SwapConversion.approvePaymentProxyToSpend(
    mainPaymentAddresses.DAI_address
  );
  await erc20SwapConversion.approveRouterToSpend(mainPaymentAddresses.ERC20Test_address);

  // EthConversion
  const ethConversionProxyAddress =
    (
      await deployETHConversionProxy(
        {
          ...args,
          chainlinkConversionPathAddress: conversionPathInstance.address,
          ethFeeProxyAddress: mainPaymentAddresses.ETHFeeProxy_address,
          nativeTokenHash: ETH_hash,
        },
        hre,
      )
    )?.address ?? '(missing)';
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
