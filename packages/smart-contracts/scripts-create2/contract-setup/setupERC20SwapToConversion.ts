import { HardhatRuntimeEnvironmentExtended } from '../types';

export const setupERC20SwapToConversion = async (
  contractAddress: string,
  hre: HardhatRuntimeEnvironmentExtended,
) => {
  await Promise.all(
    hre.config.xdeploy.networks.map((network) => {
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
    }),
  );
};
