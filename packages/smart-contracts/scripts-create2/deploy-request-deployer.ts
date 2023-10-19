import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { HardhatRuntimeEnvironmentExtended } from './types.js';
import { verifyOne } from './verify.js';

// Deploys, set up the contracts
export async function deployDeployer(hre: HardhatRuntimeEnvironment): Promise<void> {
  try {
    const [deployer] = await hre.ethers.getSigners();

    // Deploy the contract RequestDeployer
    const RequestDeployer__factory = await hre.ethers.getContractFactory(
      'RequestDeployer',
      deployer,
    );
    const RequestDeployer = await RequestDeployer__factory.deploy();
    await verifyOne(
      RequestDeployer.address,
      { contract: 'RequestDeployer' },
      hre as HardhatRuntimeEnvironmentExtended,
    );

    // ----------------------------------
    console.log('Contract deployed');
    console.log(`
      RequestDeployer:        ${RequestDeployer.address}
      Block number:           ${RequestDeployer.deployTransaction.blockNumber}
      `);
  } catch (e) {
    console.error(e);
  }
}

// Verifies the RequestDeployer (useful if the verification failed after deployment)
export async function verifyDeployer(hre: HardhatRuntimeEnvironment): Promise<void> {
  try {
    const RequestDeployer = await hre.ethers.getContractAt(
      'RequestDeployer',
      (hre as HardhatRuntimeEnvironmentExtended).config.xdeploy.deployerAddress,
    );
    await verifyOne(
      RequestDeployer.address,
      { contract: 'RequestDeployer' },
      hre as HardhatRuntimeEnvironmentExtended,
    );
  } catch (e) {
    console.error(e);
  }
}
