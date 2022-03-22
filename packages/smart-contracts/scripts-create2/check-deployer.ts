import { constants, providers } from 'ethers';
import { getDefaultProvider } from 'payment-detection';
import { HardhatRuntimeEnvironmentExtended } from './types';

export const checkCreate2Deployer = async (
  hre: HardhatRuntimeEnvironmentExtended,
): Promise<void> => {
  if (!hre.config.xdeploy.networks || hre.config.xdeploy.networks.length === 0) {
    throw new Error('Invalid network configuration');
  }
  if (!hre.config.xdeploy.deployerAddress) {
    throw new Error('Deployer contract address missing');
  }
  await Promise.all(
    hre.config.xdeploy.networks.map(async (network: string) => {
      let provider;
      if (network === 'celo') {
        provider = new providers.JsonRpcProvider('https://forno.celo.org');
        const originalBlockFormatter = provider.formatter._block;
        provider.formatter._block = (value: any, format: any) => {
          return originalBlockFormatter(
            {
              gasLimit: constants.Zero,
              ...value,
            },
            format,
          );
        };
      } else {
        provider = getDefaultProvider(network);
      }
      const code = await provider.getCode(hre.config.xdeploy.deployerAddress);

      if (code === '0x') {
        throw new Error(
          `There is no deployer contract for network ${network} at address ${hre.config.xdeploy.deployerAddress}`,
        );
      }
    }),
  );
};
