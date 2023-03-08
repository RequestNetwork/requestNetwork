import { erc20SwapToPayArtifact } from '../../src/lib';
import { HardhatRuntimeEnvironmentExtended } from '../types';
import { getSignerAndGasFees, updateRequestSwapFees, updateSwapRouter } from './adminTasks';

/**
 * Once deployed, setup the values of the ERC20SwapToPay contract
 * @param contractAddress address of the ERC20SwapToPay Proxy
 * @param hre Hardhat runtime environment
 */
export const setupERC20SwapToPay = async (
  contractAddress: string,
  hre: HardhatRuntimeEnvironmentExtended,
): Promise<void> => {
  // Setup contract parameters
  const ERC20SwapToPayContract = new hre.ethers.Contract(
    contractAddress,
    erc20SwapToPayArtifact.getContractAbi(),
  );
  await Promise.all(
    hre.config.xdeploy.networks.map(async (network) => {
      try {
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
