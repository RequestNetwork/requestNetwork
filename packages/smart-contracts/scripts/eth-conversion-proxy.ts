import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { deployOne } from './deploy-one';

export default async function deploy(
  args: {
    chainlinkConversionPathAddress?: string;
    ethFeeProxyAddress?: string;
    nativeTokenHash?: string;
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
    console.error(
      `Missing EthereumFeeProxy on ${hre.network.name}, cannot deploy ${contractName}.`,
    );
    return;
  }

  if (!args.nativeTokenHash) {
    console.error(`Missing nativeTokenHash on ${hre.network.name}, cannot deploy ${contractName}.`);
    return;
  }

  return deployOne(args, hre, contractName, {
    constructorArguments: [
      args.ethFeeProxyAddress,
      args.chainlinkConversionPathAddress,
      args.nativeTokenHash,
    ],
  });
}
