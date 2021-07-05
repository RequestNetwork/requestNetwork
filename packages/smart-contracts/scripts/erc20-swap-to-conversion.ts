import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { erc20SwapConversionArtifact, erc20ConversionProxy } from '..';
import { deploy as deployOne } from './deploy-one';

const contractName = 'ERC20SwapToConversion';
// Uniswap V2 Router address
const swapRouterAddress = '0x7a250d5630b4cf539739df2c5dacb4c659f2488d';

// The required ERC20 approvals for swapping will be performed on these tokens.
const defaultTokens: { [network: string]: string[] } = {
  rinkeby: [
    // FAU
    '0xfab46e002bbf0b4509813474841e0716e6730136',
    // CTBK
    '0x995d6a8c21f24be1dd04e105dd0d83758343e258',
  ],
};

export async function deploy(args: any, hre: HardhatRuntimeEnvironment) {
  try {
    if (!args.conversionProxyAddress) {
      args.conversionProxyAddress = erc20ConversionProxy.getAddress(hre.network.name);
    }
  } catch (e) {
    console.error(
      `No conversion proxy deployed on ${hre.network.name}, cannot deploy ${contractName}.`,
    );
    return;
  }
  const convSwapProxyAddress = await deployOne(
    args,
    hre,
    erc20SwapConversionArtifact,
    contractName,
    [swapRouterAddress, args.conversionProxyAddress],
  );

  console.log(`Approving tokens for swaps...`);
  const mainFactory = await hre.ethers.getContractFactory(contractName);
  const convSwapProxy = await mainFactory.attach(convSwapProxyAddress);

  if (defaultTokens[hre.network.name]) {
    const approbationTransactions = defaultTokens[hre.network.name].map(async (erc20Address) => {
      await convSwapProxy.approveRouterToSpend(erc20Address);
      await convSwapProxy.approvePaymentProxyToSpend(erc20Address);
      console.log(`Approved: ${erc20Address}`);
    });
    await Promise.all(approbationTransactions);
  }

  console.log('Done');
}
