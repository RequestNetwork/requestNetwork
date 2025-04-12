import { erc20ConversionProxy } from '../../src/lib';
import { HardhatRuntimeEnvironmentExtended } from '../types';
import {
  getSignerAndGasFees,
  updateChainlinkConversionPath,
  updatePaymentFeeProxyAddress,
} from './adminTasks';
import { EvmChains } from '@requestnetwork/currency';

const ERC20ConversionVersion = '0.1.2';

/**
 * Updates the values of the chainlinkConversionPath and ERC20FeeProxy addresses if needed
 * @param contractAddress address of the ERC20Conversion contract.
 *                        If not provided fallback to the latest deployment address
 * @param hre Hardhat runtime environment
 * @param signWithEoa Are transactions to be signed by an EAO
 */
export const setupErc20ConversionProxy = async ({
  contractAddress,
  hre,
  signWithEoa,
}: {
  contractAddress?: string;
  hre: HardhatRuntimeEnvironmentExtended;
  signWithEoa: boolean;
}): Promise<void> => {
  await Promise.all(
    hre.config.xdeploy.networks.map(async (network: string) => {
      try {
        EvmChains.assertChainSupported(network);
        if (!contractAddress) {
          contractAddress = erc20ConversionProxy.getAddress(network);
        }
        const Erc20ConversionProxyContract = new hre.ethers.Contract(
          contractAddress,
          erc20ConversionProxy.getContractAbi(ERC20ConversionVersion),
        );

        const { signer, txOverrides } = await getSignerAndGasFees(network, hre);
        const Erc20ConversionProxyConnected = Erc20ConversionProxyContract.connect(signer);
        await updatePaymentFeeProxyAddress(
          Erc20ConversionProxyConnected,
          network,
          txOverrides,
          'erc20',
          signer,
          signWithEoa,
        );
        await updateChainlinkConversionPath(
          Erc20ConversionProxyConnected,
          network,
          txOverrides,
          signer,
          signWithEoa,
        );
        console.log(`Setup of Erc20ConversionProxy successful on ${network}`);
      } catch (err) {
        console.warn(`An error occurred during the setup of Erc20ConversionProxy on ${network}`);
        console.warn(err);
      }
    }),
  );
};
