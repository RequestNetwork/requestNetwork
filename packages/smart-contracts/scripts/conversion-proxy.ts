import { HardhatRuntimeEnvironment } from 'hardhat/types';
import {
  erc20ConversionProxy as erc20ConversionProxyArtifact,
  ethConversionArtifact,
} from '../src/lib';
import { DeploymentResult, deployOne } from './deploy-one';
import { CurrencyManager } from '@requestnetwork/currency';

export async function deployERC20ConversionProxy(
  args: { chainlinkConversionPathAddress?: string; erc20FeeProxyAddress?: string },
  hre: HardhatRuntimeEnvironment,
): Promise<DeploymentResult | undefined> {
  const contractName = 'Erc20ConversionProxy';

  if (!args.chainlinkConversionPathAddress) {
    // FIXME: should try to retrieve information from artifacts instead
    console.error(
      `Missing ChainlinkConversionPath on ${hre.network.name}, cannot deploy ${contractName}.`,
    );
    return undefined;
  }
  if (!args.erc20FeeProxyAddress) {
    // FIXME: should try to retrieve information from artifacts instead
    console.error(`Missing ERC20FeeProxy on ${hre.network.name}, cannot deploy ${contractName}.`);
    return undefined;
  }

  return deployOne(args, hre, contractName, {
    constructorArguments: [args.erc20FeeProxyAddress, args.chainlinkConversionPathAddress],
    artifact: erc20ConversionProxyArtifact,
  });
}

export async function deployETHConversionProxy(
  args: {
    chainlinkConversionPathAddress?: string;
    ethFeeProxyAddress?: string;
  },
  hre: HardhatRuntimeEnvironment,
) {
  const contractName = 'EthConversionProxy';

  if (!args.chainlinkConversionPathAddress) {
    // FIXME: should try to retrieve information from artifacts instead
    console.error(
      `Missing ChainlinkConversionPath on ${hre.network.name}, cannot deploy ${contractName}.`,
    );
    return;
  }
  if (!args.ethFeeProxyAddress) {
    // FIXME: should try to retrieve information from artifacts instead
    console.error(`Missing ETHFeeProxy on ${hre.network.name}, cannot deploy ${contractName}.`);
    return;
  }

  // The private native token hash is the same as on mainnet
  const nativeTokenNetwork = hre.network.name === 'private' ? 'mainnet' : hre.network.name;
  const nativeTokenHash = CurrencyManager.getDefault().getNativeCurrency('ETH', nativeTokenNetwork)
    ?.hash;
  if (!nativeTokenHash) {
    console.error(
      `Cannot guess native token hash on ${hre.network.name}, cannot deploy ${contractName}.`,
    );
    return;
  }

  return deployOne(args, hre, contractName, {
    constructorArguments: [
      args.ethFeeProxyAddress,
      args.chainlinkConversionPathAddress,
      nativeTokenHash,
    ],
    artifact: ethConversionArtifact,
  });
}
