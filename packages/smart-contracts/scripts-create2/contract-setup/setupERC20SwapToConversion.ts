import {
  chainlinkConversionPath,
  erc20ConversionProxy,
  erc20SwapConversionArtifact,
} from '../../src/lib';
import { HardhatRuntimeEnvironmentExtended } from '../types';
import utils from '@requestnetwork/utils';
import { uniswapV2RouterAddresses } from '../../scripts/utils';

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

      // FIXME: If we are to deploy a new ERC20ConversionProxy contract (through the deployer)
      //        its address will have to be pass down directly to the constructor and this
      //        step will have to be removed. (This way, for each version of the pn any-to-erc20
      //        there will be an associated SwapToConversion contract).
      //
      // FIXME2:  As swap contracts are not payment network themselves, we do not handle
      //          versionning for them (we choose the last version by default when paying).
      //          Each version of a PN should be tied to a specific version of a Swap
      //          and we should detect which version of the swap to use depending on PN version.
      const currentProxyAddress = await ERC20SwapToConversionConnected.paymentProxy();
      const conversionProxyAddress = erc20ConversionProxy.getAddress(network);
      if (currentProxyAddress !== conversionProxyAddress) {
        await ERC20SwapToConversionConnected.updateConversionPathAddress(conversionProxyAddress);
      }

      const currentSwapRouter = await ERC20SwapToConversionConnected.swapRouter();
      if (currentSwapRouter !== uniswapV2RouterAddresses[network]) {
        await ERC20SwapToConversionConnected.setRouter(uniswapV2RouterAddresses[network]);
      }
    }),
  );
  console.log('Setup for ERC20SwapToConversion successfull');
};
