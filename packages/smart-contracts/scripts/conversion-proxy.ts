import { HardhatRuntimeEnvironment } from 'hardhat/types';
import {
  erc20ConversionProxy as erc20ConversionProxyArtifact,
  ethConversionArtifact,
} from '../src/lib';
import { deployOne } from './deploy-one';
import { CurrencyManager } from '@requestnetwork/currency';
import { RequestLogicTypes } from '@requestnetwork/types';
import { Erc20ConversionProxy } from 'smart-contracts/src/types';

export async function deployERC20ConversionProxy(
  args: {
    chainlinkConversionPathAddress?: string;
    erc20FeeProxyAddress?: string;
    nonceCondition?: number;
  },
  hre: HardhatRuntimeEnvironment,
) {
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

  return deployOne<Erc20ConversionProxy>(args, hre, contractName, {
    constructorArguments: [args.erc20FeeProxyAddress, args.chainlinkConversionPathAddress],
    artifact: erc20ConversionProxyArtifact,
    nonceCondition: args.nonceCondition,
    version: '0.1.1',
  });
}

export async function deployETHConversionProxy(
  args: {
    chainlinkConversionPathAddress?: string;
    ethFeeProxyAddress?: string;
    nonceCondition?: number;
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
  const nativeTokenHash = CurrencyManager.getDefault().getNativeCurrency(
    RequestLogicTypes.CURRENCY.ETH,
    nativeTokenNetwork,
  )?.hash;
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
    nonceCondition: args.nonceCondition,
  });
}
