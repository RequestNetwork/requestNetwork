import { HardhatRuntimeEnvironmentExtended } from './types';

export const checkCreate2Deployer = async (
  hre: HardhatRuntimeEnvironmentExtended,
): Promise<void> => {
  if (!hre.config.xdeploy.networks || hre.config.xdeploy.networks.length === 0) {
    throw new Error('Invalid network configuration');
  }
  await Promise.all(
    hre.config.xdeploy.networks.map(async (network: string, index: number) => {
      if (!hre.config.xdeploy.rpcUrls || !hre.config.xdeploy.rpcUrls[index]) {
        throw new Error('Bad network configuration for ' + network);
      }
      if (!hre.config.xdeploy.deployerAddress) {
        throw new Error('Deployer contract address missing');
      }
      const provider = new hre.ethers.providers.JsonRpcProvider(hre.config.xdeploy.rpcUrls[index]);
      const code = await provider.getCode(hre.config.xdeploy.deployerAddress);

      if (code === '0x') {
        throw new Error(
          `There is no deployer contract for network ${network} at address ${hre.config.xdeploy.deployerAddress}`,
        );
      }
    }),
  );
};
