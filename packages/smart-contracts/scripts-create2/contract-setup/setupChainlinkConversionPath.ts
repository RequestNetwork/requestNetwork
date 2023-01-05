import { CurrencyManager } from '@requestnetwork/currency';
import { RequestLogicTypes } from '@requestnetwork/types';
import { chainlinkConversionPath } from '../../src/lib';
import { HardhatRuntimeEnvironmentExtended } from '../types';
import { getSignerAndGasFees, updateNativeTokenHash } from './adminTasks';

/**
 * Setup the chainlinkConversionPath values once deployed
 * @param contractAddress address of the ChainlinkConversionPath contract
 * @param hre Hardhat runtime environment
 */
export const setupChainlinkConversionPath = async (
  contractAddress: string,
  hre: HardhatRuntimeEnvironmentExtended,
): Promise<void> => {
  // Setup contract parameters
  const ChainlinkConversionPathContract = new hre.ethers.Contract(
    contractAddress,
    chainlinkConversionPath.getContractAbi(),
  );
  await Promise.all(
    hre.config.xdeploy.networks.map(async (network) => {
      try {
        const { signer, txOverrides } = await getSignerAndGasFees(network, hre);
        const nativeTokenHash = CurrencyManager.getDefault().getNativeCurrency(
          RequestLogicTypes.CURRENCY.ETH,
          network,
        )?.hash;
        if (!nativeTokenHash) {
          throw new Error(`Could not guess native token hash for network ${network}`);
        }
        const ChainlinkConversionPathConnected = ChainlinkConversionPathContract.connect(signer);
        await updateNativeTokenHash(
          'ChainlinkConversionPath',
          ChainlinkConversionPathConnected,
          nativeTokenHash,
          txOverrides,
        );
        console.log(`Setup of ChainlinkConversionPath successful on ${network}`);
      } catch (err) {
        console.warn(`An error occurred during the setup of ChainlinkConversionPath on ${network}`);
        console.warn(err);
      }
    }),
  );
};
