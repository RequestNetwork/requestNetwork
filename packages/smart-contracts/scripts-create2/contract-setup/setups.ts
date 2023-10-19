import { HardhatRuntimeEnvironmentExtended } from '../types';
import { setupETHConversionProxy } from './setupETHConversionProxy.js';
import { setupBatchConversionPayments } from './setupBatchConversionPayments.js';
import { setupERC20SwapToConversion } from './setupERC20SwapToConversion.js';
import { setupERC20SwapToPay } from './setupERC20SwapToPay.js';
import { setupChainlinkConversionPath } from './setupChainlinkConversionPath.js';
import { setupErc20ConversionProxy } from './setupErc20ConversionProxy.js';

/**
 * Administrate the specified contract at the specified address
 * If the address is not provided fallback to the contract latest deployment address
 * @param contractAddress address of the proxy
 * @param hre Hardhat runtime environment
 * @param contractName name of the contract
 */
export const setupContract = async ({
  contractAddress,
  contractName,
  hre,
}: {
  contractAddress?: string;
  contractName: string;
  hre: HardhatRuntimeEnvironmentExtended;
}): Promise<void> => {
  switch (contractName) {
    case 'ChainlinkConversionPath': {
      await setupChainlinkConversionPath({ contractAddress, hre });
      break;
    }
    case 'EthConversionProxy': {
      await setupETHConversionProxy({ contractAddress, hre });
      break;
    }
    case 'Erc20ConversionProxy': {
      await setupErc20ConversionProxy({ contractAddress, hre });
      break;
    }
    case 'ERC20SwapToPay': {
      await setupERC20SwapToPay({ contractAddress, hre });
      break;
    }
    case 'ERC20SwapToConversion': {
      await setupERC20SwapToConversion({ contractAddress, hre });
      break;
    }
    case 'BatchConversionPayments': {
      await setupBatchConversionPayments({ contractAddress, hre });
      break;
    }
    default: {
      console.log(`No setup to perform for contract ${contractName}`);
      break;
    }
  }
};
