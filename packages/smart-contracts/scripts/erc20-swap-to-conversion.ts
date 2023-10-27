import { HardhatRuntimeEnvironment } from 'hardhat/types';
// eslint-disable-next-line
// @ts-ignore Cannot find module
import { ERC20SwapToConversion } from '../src/types';
import { erc20SwapConversionArtifact } from '../src/lib';
import { DeploymentResult, deployOne } from './deploy-one';
import { uniswapV2RouterAddresses } from './utils';

const contractName = 'ERC20SwapToConversion';

export async function deploySwapConversion(
  args: {
    conversionProxyAddress?: string;
    swapProxyAddress?: string;
    nonceCondition?: number;
  },
  hre: HardhatRuntimeEnvironment,
): Promise<DeploymentResult> {
  const [deployer] = await hre.ethers.getSigners();
  if (!args.conversionProxyAddress) {
    // FIXME: should try to retrieve information from artifacts instead
    console.error(
      `Missing conversion proxy on ${hre.network.name}, cannot deploy ${contractName}.`,
    );
  }
  if (!uniswapV2RouterAddresses[hre.network.name] && !args.swapProxyAddress) {
    console.error(`Missing swap router, cannot deploy ${contractName}.`);
  }
  const deployment = await deployOne<ERC20SwapToConversion>(args, hre, contractName, {
    constructorArguments: [deployer.address],
    artifact: erc20SwapConversionArtifact,
    nonceCondition: args.nonceCondition,
  });

  return deployment;
}
