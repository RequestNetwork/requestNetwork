import { HardhatRuntimeEnvironmentExtended } from './types';
import { create2ContractDeploymentList } from './utils';
import { EvmChains } from '@requestnetwork/currency';
import { updateOwner } from './contract-setup/update-owner';
import { updateWhitelistedRole } from './contract-setup/update-whitelisted-role';

export const transferOwnership = async (
  hre: HardhatRuntimeEnvironmentExtended,
  signWithEoa: boolean,
): Promise<void> => {
  const chain = hre.network.name;
  EvmChains.assertChainSupported(chain);
  await Promise.all(
    create2ContractDeploymentList.map(async (contract) => {
      switch (contract) {
        case 'Erc20ConversionProxy':
        case 'ERC20EscrowToPay':
        case 'BatchConversionPayments':
        case 'ERC20SwapToPay':
        case 'ERC20SwapToConversion': {
          await updateOwner({ contract, hre, signWithEoa });
          break;
        }
        case 'EthConversionProxy':
        case 'ChainlinkConversionPath': {
          await updateWhitelistedRole({ contract, hre, signWithEoa });
          break;
        }
        // Other cases to add when necessary
        default:
          throw new Error(`The contract ${contract} do not have to be administrated`);
      }
    }),
  );
};
