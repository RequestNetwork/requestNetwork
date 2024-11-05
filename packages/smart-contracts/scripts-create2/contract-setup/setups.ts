import { HardhatRuntimeEnvironmentExtended } from '../types';
import { setupETHConversionProxy } from './setupETHConversionProxy';
import { setupBatchConversionPayments } from './setupBatchConversionPayments';
import { setupERC20SwapToConversion } from './setupERC20SwapToConversion';
import { setupERC20SwapToPay } from './setupERC20SwapToPay';
import { setupChainlinkConversionPath } from './setupChainlinkConversionPath';
import { setupErc20ConversionProxy } from './setupErc20ConversionProxy';
import { setupSRPF } from './setupSingleRequestProxyFactory';

/**
 * Administrate the specified contract at the specified address
 * If the address is not provided fallback to the contract latest deployment address
 * @param contractAddress address of the proxy
 * @param hre Hardhat runtime environment
 * @param contractName name of the contract
 * @param signWithEao Is the signer an EAO account.
 */
export const setupContract = async ({
  contractAddress,
  contractName,
  hre,
  signWithEoa,
}: {
  contractAddress?: string;
  contractName: string;
  hre: HardhatRuntimeEnvironmentExtended;
  signWithEoa: boolean;
}): Promise<void> => {
  switch (contractName) {
    case 'ChainlinkConversionPath': {
      await setupChainlinkConversionPath({ contractAddress, hre, signWithEoa });
      break;
    }
    case 'EthConversionProxy': {
      await setupETHConversionProxy({ contractAddress, hre, signWithEoa });
      break;
    }
    case 'Erc20ConversionProxy': {
      await setupErc20ConversionProxy({ contractAddress, hre, signWithEoa });
      break;
    }
    case 'ERC20SwapToPay': {
      await setupERC20SwapToPay({ contractAddress, hre, signWithEoa });
      break;
    }
    case 'ERC20SwapToConversion': {
      await setupERC20SwapToConversion({ contractAddress, hre, signWithEoa });
      break;
    }
    case 'BatchConversionPayments': {
      await setupBatchConversionPayments({ contractAddress, hre, signWithEoa });
      break;
    }
    case 'SingleRequestProxyFactory': {
      await setupSRPF({ contractAddress, hre, signWithEoa });
      break;
    }
    default: {
      console.log(`No setup to perform for contract ${contractName}`);
      break;
    }
  }
};
