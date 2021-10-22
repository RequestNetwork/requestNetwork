import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { erc20SwapConversionArtifact } from '../src/lib';
import { deployOne } from './deploy-one';
import { uniswapV2RouterAddresses } from './utils';

const contractName = 'ERC20SwapToConversion';

export async function deploySwapConversion(
  args: { conversionProxyAddress?: string; swapProxyAddress?: string },
  hre: HardhatRuntimeEnvironment,
) {
  if (!args.conversionProxyAddress) {
    // FIXME: should try to retrieve information from artifacts instead
    console.error(
      `Missing conversion proxy on ${hre.network.name}, cannot deploy ${contractName}.`,
    );
  }
  if (!uniswapV2RouterAddresses[hre.network.name] && !args.swapProxyAddress) {
    console.error(`Missing swap router, cannot deploy ${contractName}.`);
  }
  const deployment = await deployOne(args, hre, contractName, {
    constructorArguments: [
      uniswapV2RouterAddresses[hre.network.name] ?? args.swapProxyAddress,
      args.conversionProxyAddress,
    ],
    artifact: erc20SwapConversionArtifact,
  });

  return deployment;
}

/**
 * Prepares ERC20 approvals for the swap conversion contract.
 * */
export async function prepareSwapConversion(
  hre: HardhatRuntimeEnvironment,
  convSwapProxyAddress?: string,
) {
  const [, signer] = await hre.ethers.getSigners();
  if (!signer) {
    console.warn(`Warning: no signer given for administration tasks, cannot do ERC20 approvals.`);
  }

  const mainFactory = await hre.ethers.getContractFactory(contractName, signer);
  const convSwapProxy = convSwapProxyAddress
    ? mainFactory.attach(convSwapProxyAddress)
    : erc20SwapConversionArtifact.connect(hre.network.name, signer);
  if (!defaultTokens[hre.network.name]) {
    console.log(`No default token to approve for ${contractName} on ${hre.network.name}`);
    return 0;
  }
  if (convSwapProxy) {
    console.log(`Approving tokens for swaps...`);
    const approbationTransactions = defaultTokens[hre.network.name].map(async (erc20Address) => {
      await convSwapProxy.approveRouterToSpend(erc20Address);
      await convSwapProxy.approvePaymentProxyToSpend(erc20Address);
      console.log(`Approved: ${erc20Address}`);
    });
    await Promise.all(approbationTransactions);
    return defaultTokens[hre.network.name].length;
  }
  return 0;
}

/**
 * Main tokens to be used to swap, per chain.
 * The required ERC20 approvals for swapping will be performed on these tokens.
 */
const defaultTokens: { [network: string]: string[] } = {
  // FIXME: add main tokens used on all chains
  private: [
    // ERC20Alpha
    '0x38cF23C52Bb4B13F051Aec09580a2dE845a7FA35',
    // TestERC20
    '0x9FBDa871d559710256a2502A2517b794B482Db40',
  ],
  rinkeby: [
    // FAU
    '0xfab46e002bbf0b4509813474841e0716e6730136',
    // CTBK
    '0x995d6a8c21f24be1dd04e105dd0d83758343e258',
  ],
};
