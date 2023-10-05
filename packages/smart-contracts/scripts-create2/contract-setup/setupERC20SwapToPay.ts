import { EvmChains } from '@requestnetwork/currency';
import { erc20SwapToPayArtifact } from '../../src/lib';
import { HardhatRuntimeEnvironmentExtended } from '../types';
import { getSignerAndGasFees, updateRequestSwapFees, updateSwapRouter } from './adminTasks';

/**
 * Once deployed, setup the values of the ERC20SwapToPay contract
 * @param contractAddress address of the ERC20SwapToPay contract
 *                        If not provided fallback to the latest deployment address
 * @param hre Hardhat runtime environment
 */
export const setupERC20SwapToPay = async ({
  contractAddress,
  hre,
}: {
  contractAddress?: string;
  hre: HardhatRuntimeEnvironmentExtended;
}): Promise<void> => {
  await Promise.all(
    hre.config.xdeploy.networks.map(async (network) => {
      try {
        EvmChains.assertChainSupported(network);
        if (!contractAddress) {
          contractAddress = erc20SwapToPayArtifact.getAddress(network);
        }
        const ERC20SwapToPayContract = new hre.ethers.Contract(
          contractAddress,
          erc20SwapToPayArtifact.getContractAbi(),
        );
        const { signer, txOverrides } = await getSignerAndGasFees(network, hre);
        const ERC20SwapToPayConnected = await ERC20SwapToPayContract.connect(signer);

        await updateSwapRouter(ERC20SwapToPayConnected, network, txOverrides);
        await updateRequestSwapFees(ERC20SwapToPayConnected, txOverrides);
        console.log(`Setup of ERC20SwapToPay successful on ${network}`);
      } catch (err) {
        console.warn(`An error occurred during the setup of ERC20SwapToPay on ${network}`);
        console.warn(err);
      }
    }),
  );
};
