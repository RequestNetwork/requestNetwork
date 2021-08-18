import '@nomiclabs/hardhat-ethers';
import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { deployOne } from './deploy-one';


export default async function deploy(arg: any, hre: HardhatRuntimeEnvironment) {

  // Deploy the contracts
  const TestTokenInstance = await deployOne(arg, hre, 'TestToken');
  const ERC20FeeProxyInstance = await deployOne(arg, hre, 'ERC20FeeProxy');
  const MyEscrowInstance = await deployOne(ERC20FeeProxyInstance, hre, 'MyEscrow');

  console.log("Contract deployment status:")
  console.log(`

    TestERC20:                      ${TestTokenInstance},
    IERC20FeeProxy deployed to:     ${ERC20FeeProxyInstance},
    MyEscrow deployed to:           ${MyEscrowInstance} 
  `);

}
/*
export default async function deploy(args: any, hre: HardhatRuntimeEnvironment) {
  const [deployer] = await hre.ethers.getSigners();
  const AggDAI_USD_address = await deployOne(args, hre, 'AggregatorMock', [101000000, 8, 60]);
  const AggETH_USD_address = await deployOne(args, hre, 'AggregatorMock', [50000000000, 8, 60]);
  const AggEUR_USD_address = await deployOne(args, hre, 'AggregatorMock', [120000000, 8, 60]);
  const AggUSDT_ETH_address = await deployOne(args, hre, 'AggregatorMock', [2000000000000000, 18, 60]);
  const USDT_fake_address = await deployOne(args, hre, 'UsdtFake');

  // all these addresses are for test purposes
  const ETH_address = Currency.fromSymbol('ETH').getHash();
  const USD_address = Currency.fromSymbol('USD').getHash();
  const EUR_address = Currency.fromSymbol('EUR').getHash();
  // Cf. ERC20Alpha in TestERC20.sol
  const DAI_address = new Currency({
    type: 'ERC20' as any,
    value: '0x38cF23C52Bb4B13F051Aec09580a2dE845a7FA35',
  }).getHash();
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

  // ----------------------------------
  console.log('Contracts deployed');
  console.log(`
    (fake) USDT:              ${USDT_address}
    AggDAI_USD:               ${AggDAI_USD_address}
    ChainlinkConversionPath:  ${conversionPathInstance.address}
    Erc20ConversionProxy:     ${erc20ConversionAddress}
    Erc20SwapConversionProxy: ${erc20SwapConversionAddress}
    `);
}
*/