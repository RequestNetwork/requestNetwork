import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { erc20ConversionProxy, chainlinkConversionPath, erc20FeeProxyArtifact } from '..';
import { deploy as deployOne } from './deploy-one';

export async function deploy(args: any, hre: HardhatRuntimeEnvironment) {
  const contractName = 'Erc20ConversionProxy';

  try {
    if (!args.chainlinkConversionPathAddress) {
      args.chainlinkConversionPathAddress = chainlinkConversionPath.getAddress(hre.network.name);
    }
  } catch (e) {
    console.error(
      `Missing ChainlinkConversionPath on ${hre.network.name}, cannot deploy ${contractName}.`,
    );
    return;
  }
  try {
    if (!args.erc20FeeProxyAddress) {
      args.erc20FeeProxyAddress = erc20FeeProxyArtifact.getAddress(hre.network.name);
    }
  } catch (e) {
    console.error(`Missing ERC20FeeProxy on ${hre.network.name}, cannot deploy ${contractName}.`);
    return;
  }

  return deployOne(args, hre, erc20ConversionProxy, contractName, [
    args.chainlinkConversionPathAddress,
    args.erc20FeeProxyAddress,
  ]);
}
