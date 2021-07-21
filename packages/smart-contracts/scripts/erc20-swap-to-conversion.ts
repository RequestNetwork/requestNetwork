import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { erc20SwapConversionArtifact } from '../src/lib';
import deployOne from './deploy-one';

const contractName = 'ERC20SwapToConversion';
// Uniswap V2 Router address
const localSwapRouterAddress = '0x7a250d5630b4cf539739df2c5dacb4c659f2488d';

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
  if (!args.swapProxyAddress) {
    // FIXME: should try to retrieve information from artifacts instead
    console.error(`Missing swap router, cannot deploy ${contractName}.`);
  }
  const convSwapProxyAddress = await deployOne(
    args,
    hre,
    contractName,
    [localSwapRouterAddress, args.conversionProxyAddress],
    erc20SwapConversionArtifact,
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
  return convSwapProxyAddress;
}
