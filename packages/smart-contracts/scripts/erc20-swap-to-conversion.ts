import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { deployOne } from './deploy-one';

const contractName = 'ERC20SwapToConversion';
// Uniswap V2 Router address
const swapRouterAddress: Record<string, string> = {
  private: '0x4E72770760c011647D4873f60A3CF6cDeA896CD8',
  mainnet: '0x7a250d5630b4cf539739df2c5dacb4c659f2488d',
  rinkeby: '0x7a250d5630b4cf539739df2c5dacb4c659f2488d',
};

// The required ERC20 approvals for swapping will be performed on these tokens.
const defaultTokens: { [network: string]: string[] } = {
  rinkeby: [
    // FAU
    '0xfab46e002bbf0b4509813474841e0716e6730136',
    // CTBK
    '0x995d6a8c21f24be1dd04e105dd0d83758343e258',
  ],
};

export default async function deploy(
  args: { conversionProxyAddress?: string; swapProxyAddress?: string },
  hre: HardhatRuntimeEnvironment,
) {
  if (!args.conversionProxyAddress) {
    // FIXME: should try to retrieve information from artifacts instead
    console.error(
      `Missing conversion proxy on ${hre.network.name}, cannot deploy ${contractName}.`,
    );
  }
  if (!swapRouterAddress[hre.network.name] && !args.swapProxyAddress) {
    console.error(`Missing swap router, cannot deploy ${contractName}.`);
  }
  const convSwapProxyAddress = await deployOne(args, hre, contractName, [
    swapRouterAddress[hre.network.name] ?? args.swapProxyAddress,
    args.conversionProxyAddress,
  ]);

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
  return convSwapProxyAddress;
}
