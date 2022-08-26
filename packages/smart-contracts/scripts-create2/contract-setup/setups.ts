import { HardhatRuntimeEnvironmentExtended } from '../types';
import { setupETHConversionProxy } from './setupETHConversionProxy';
import { setupBatchPayments } from './setupBatchPayments';
import { setupBatchConversionPayments } from './setupBatchConversionPayments';
import { setupERC20SwapToConversion } from './setupERC20SwapToConversion';

/**
 * Updates the values of either BatchPayments, ETHConversionProxy, or ERC20SwapToConversion contract, if needed
 * @param contractAddress address of the proxy
 * @param hre Hardhat runtime environment
 * @param contractName name of the contract
 */
export const setupContract = async (
  contractAddress: string,
  hre: HardhatRuntimeEnvironmentExtended,
  contractName: string,
): Promise<void> => {
  switch (contractName) {
    case 'ETHConversionProxy': {
      await setupETHConversionProxy(contractAddress, hre);
      break;
    }
    case 'ERC20SwapToConversion': {
      await setupERC20SwapToConversion(contractAddress, hre);
      break;
    }
    case 'BatchPayments': {
      await setupBatchPayments(contractAddress, hre);
      break;
    }
    case 'BatchConversionPayments': {
      await setupBatchConversionPayments(contractAddress, hre);
      break;
    }
    default: {
      console.log('Contract name not found');
      break;
    }
  }
};
