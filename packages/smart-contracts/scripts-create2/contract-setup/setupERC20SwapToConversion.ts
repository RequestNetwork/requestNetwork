import { chainlinkConversionPath, erc20SwapConversionArtifact } from '../../src/lib';
import { HardhatRuntimeEnvironmentExtended } from '../types';
import utils from '@requestnetwork/utils';
import { uniswapV2RouterAddresses } from '../../scripts/utils';

/**
 * Updates the values of the chainlinkConversionPath and swap router of the ERC20SwapToConversion contract
 * @param contractAddress address of the ERC20SwapToConversion Proxy
 * @param hre Hardhat runtime environment
 */
export const setupERC20SwapToConversion = async (
  contractAddress: string,
  hre: HardhatRuntimeEnvironmentExtended,
): Promise<void> => {
  // Setup contract parameters
  const ERC20SwapToConversionContract = new hre.ethers.Contract(
    contractAddress,
    erc20SwapConversionArtifact.getContractAbi(),
  );
  await Promise.all(
    hre.config.xdeploy.networks.map(async (network) => {
      let provider;
      if (network === 'celo') {
        provider = new hre.ethers.providers.JsonRpcProvider('https://forno.celo.org');
        const originalBlockFormatter = provider.formatter._block;
        provider.formatter._block = (value: any, format: any) => {
          return originalBlockFormatter(
            {
              gasLimit: hre.ethers.constants.Zero,
              ...value,
            },
            format,
          );
        };
      } else {
        provider = utils.getDefaultProvider(network);
      }
      const wallet = new hre.ethers.Wallet(hre.config.xdeploy.signer, provider);
      const signer = wallet.connect(provider);
      const ERC20SwapToConversionConnected = await ERC20SwapToConversionContract.connect(signer);

      const currentChainlinkAddress = await ERC20SwapToConversionConnected.chainlinkConversionPath();
      const chainlinkConversionPathAddress = chainlinkConversionPath.getAddress(network);
      if (currentChainlinkAddress !== chainlinkConversionPathAddress) {
        await ERC20SwapToConversionConnected.updateConversionPathAddress(
          chainlinkConversionPathAddress,
        );
      }

      const currentSwapRouter = await ERC20SwapToConversionConnected.swapRouter();
      if (currentSwapRouter !== uniswapV2RouterAddresses[network]) {
        await ERC20SwapToConversionConnected.setRouter(uniswapV2RouterAddresses[network]);
      }
    }),
  );
  console.log('Setup for ERC20SwapToConversion successfull');
};
