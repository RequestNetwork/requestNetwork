import { getDefaultProvider } from 'ethers';
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
      const provider = getDefaultProvider(network);
      const code = await provider.getCode(hre.config.xdeploy.deployerAddress);

      if (code === '0x') {
        throw new Error(
          `There is no deployer contract for network ${network} at address ${hre.config.xdeploy.deployerAddress}`,
        );
      }
    }),
  );
};
