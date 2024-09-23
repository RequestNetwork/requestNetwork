import { HardhatRuntimeEnvironmentExtended } from './types';
import { create2ContractDeploymentList } from './utils';
import { updateOwner } from './contract-setup/update-owner';
import { updateWhitelistedRole } from './contract-setup/update-whitelisted-role';

export const transferOwnership = async (
  hre: HardhatRuntimeEnvironmentExtended,
  signWithEoa: boolean,
): Promise<void> => {
  for (const contract of create2ContractDeploymentList) {
    switch (contract) {
      case 'Erc20ConversionProxy':
      case 'BatchConversionPayments':
      case 'ERC20SwapToPay':
      case 'ERC20SwapToConversion':
      case 'SingleRequestProxyFactory': {
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
        console.info(`The contract ${contract} do not have to be administrated`);
    }
  }
};
