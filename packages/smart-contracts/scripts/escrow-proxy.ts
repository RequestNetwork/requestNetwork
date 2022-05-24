import { HardhatRuntimeEnvironment } from 'hardhat/types';
// eslint-disable-next-line
// @ts-ignore Cannot find module
import { Erc20ConversionProxy } from '../src/types/Erc20ConversionProxy';
import { erc20EscrowToPayArtifact } from '../src/lib';
import { deployOne } from './deploy-one';

export async function deployERC20EscrowToPay(
  args: {
    erc20FeeProxyAddress?: string;
    nonceCondition?: number;
    version?: string;
  },
  hre: HardhatRuntimeEnvironment,
) {
  const contractName = 'ERC20EscrowToPay';

  if (!args.erc20FeeProxyAddress) {
    // FIXME: should try to retrieve information from artifacts instead
    console.error(`Missing ERC20FeeProxy on ${hre.network.name}, cannot deploy ${contractName}.`);
    return undefined;
  }

  return deployOne<Erc20ConversionProxy>(args, hre, contractName, {
    constructorArguments: [
      args.erc20FeeProxyAddress,
      process.env.ADMIN_WALLET_ADDRESS ?? (await (await hre.ethers.getSigners())[0].getAddress()),
    ],
    artifact: erc20EscrowToPayArtifact,
    nonceCondition: args.nonceCondition,
    version: args.version || '0.1.0',
  });
}
