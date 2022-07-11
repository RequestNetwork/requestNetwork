import { HardhatRuntimeEnvironmentExtended } from '../types';
import { setupEthConversionProxy } from './setupEthConversionProxy';
import { setupBatchPayments } from './setupBatchPayments';
import { setupERC20SwapToConversion } from './setupERC20SwapToConversion';

/**
 * Updates the values of either BatchPayments, EthConversionProxy, or ERC20SwapToConversion contract, if needed
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
    case 'EthConversionProxy': {
      await setupEthConversionProxy(contractAddress, hre);
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
    default: {
      console.log('Contract name not found');
      break;
    }
  }
};
