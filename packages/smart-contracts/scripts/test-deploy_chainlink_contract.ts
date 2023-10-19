import '@nomiclabs/hardhat-ethers';
import { CurrencyManager } from '@requestnetwork/currency';
import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { deployERC20ConversionProxy, deployEthConversionProxy } from './conversion-proxy.js';
import { deploySwapConversion } from './erc20-swap-to-conversion.js';
import { deployOne } from './deploy-one.js';
import { BigNumber } from 'ethers';

export const PRECISION_RATE = 100_000_000;
export const EUR_USD_RATE = BigNumber.from(1.2 * PRECISION_RATE);
export const ETH_USD_RATE = BigNumber.from(500 * PRECISION_RATE);
export const DAI_USD_RATE = BigNumber.from(1.01 * PRECISION_RATE);
export const USDT_ETH_RATE = BigNumber.from(0.002 * 1_000_000_000_000_000_000);

export default async function deploy(
  args: any,
  hre: HardhatRuntimeEnvironment,
  mainPaymentAddresses: any,
) {
  const [deployer] = await hre.ethers.getSigners();
  const { address: AggDAI_USD_address } = await deployOne(args, hre, 'AggregatorMock', {
    constructorArguments: [DAI_USD_RATE, 8, 60],
  });
  const { address: AggETH_USD_address } = await deployOne(args, hre, 'AggregatorMock', {
    constructorArguments: [ETH_USD_RATE, 8, 60],
  });
  const { address: AggEUR_USD_address } = await deployOne(args, hre, 'AggregatorMock', {
    constructorArguments: [EUR_USD_RATE, 8, 60],
  });
  const { address: AggUSDT_ETH_address } = await deployOne(args, hre, 'AggregatorMock', {
    constructorArguments: [USDT_ETH_RATE, 18, 60],
  });
  const { address: USDT_fake_address } = await deployOne(args, hre, 'UsdtFake');

  const currencyManager = CurrencyManager.getDefault();
  // all these addresses are for test purposes
  const ETH_hash = currencyManager.fromSymbol('ETH')!.hash;
  const USD_hash = currencyManager.fromSymbol('USD')!.hash;
  const EUR_hash = currencyManager.fromSymbol('EUR')!.hash;

  // Cf. ERC20Alpha in TestERC20.sol
  const DAI_address = mainPaymentAddresses.DAIAddress;

  const USDT_address = USDT_fake_address;

  console.log(`USDT address: ${USDT_address}`);

  const conversionPathInstance = await (
    await hre.ethers.getContractFactory('ChainlinkConversionPath', deployer)
  ).deploy(ETH_hash, deployer.address);

  // all these aggregators are for test purposes
  await conversionPathInstance.updateAggregatorsList(
    [DAI_address, EUR_hash, ETH_hash, USDT_address],
    [USD_hash, USD_hash, USD_hash, ETH_hash],
    [AggDAI_USD_address, AggEUR_USD_address, AggETH_USD_address, AggUSDT_ETH_address],
  );
  console.log('AggregatorsList updated.');

  // ERC20Conversion
  const ERC20Conversion = await deployERC20ConversionProxy(
    {
      ...args,
      chainlinkConversionPathAddress: conversionPathInstance.address,
      erc20FeeProxyAddress: mainPaymentAddresses.ERC20FeeProxyAddress,
    },
    hre,
  );

  if (!ERC20Conversion || !ERC20Conversion.address) {
    console.error('Deployment for ERC20Conversion failed.');
    return;
  }

  // ERC20SwapConversion
  const localSwapRouterAddress = '0x4E72770760c011647D4873f60A3CF6cDeA896CD8';
  const { address: erc20SwapConversionAddress, instance: erc20SwapConversion } =
    await deploySwapConversion(
      {
        ...args,
        conversionProxyAddress: ERC20Conversion.address,
        swapProxyAddress: localSwapRouterAddress,
      },
      hre,
    );
  if (!erc20SwapConversion) {
    console.error('Deployment for erc20SwapConversion failed.');
    return;
  }
  // Admin tasks:
  await erc20SwapConversion.setRouter(localSwapRouterAddress);
  await erc20SwapConversion.updateRequestSwapFees(5);
  await erc20SwapConversion.updateConversionPathAddress(conversionPathInstance.address);
  await erc20SwapConversion.approvePaymentProxyToSpend(
    mainPaymentAddresses.DAIAddress,
    ERC20Conversion.address,
  );
  await erc20SwapConversion.approveRouterToSpend(mainPaymentAddresses.ERC20TestAddress);

  // EthConversion
  const ethConversionProxyAddress =
    (
      await deployEthConversionProxy(
        {
          ...args,
          chainlinkConversionPathAddress: conversionPathInstance.address,
          ethFeeProxyAddress: mainPaymentAddresses.ETHFeeProxyAddress,
          owner: deployer.address,
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
    Erc20ConversionProxy:     ${ERC20Conversion.address}
    Erc20SwapConversionProxy: ${erc20SwapConversionAddress}
    EthConversionProxy:       ${ethConversionProxyAddress}
    `);
}
