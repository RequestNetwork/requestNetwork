import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { deployOne } from './deploy-one';

export default async function deploy(
  args: { chainlinkConversionPathAddress?: string; erc20FeeProxyAddress?: string },
  hre: HardhatRuntimeEnvironment,
) {
  const contractName = 'Erc20ConversionProxy';

  if (!args.chainlinkConversionPathAddress) {
    // FIXME: should try to retrieve information from artifacts instead
    console.error(
      `Missing ChainlinkConversionPath on ${hre.network.name}, cannot deploy ${contractName}.`,
    );
    return;
  }
  if (!args.erc20FeeProxyAddress) {
    // FIXME: should try to retrieve information from artifacts instead
    console.error(`Missing ERC20FeeProxy on ${hre.network.name}, cannot deploy ${contractName}.`);
    return;
  }

  return deployOne(args, hre, contractName, [
    args.erc20FeeProxyAddress,
    args.chainlinkConversionPathAddress,
  ]);
}
