import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { HardhatRuntimeEnvironmentExtended } from './types';
import { verifyOne } from './verify';

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
      '0xE99Ab70a5FAE59551544FA326fA048f7B95A24B2',
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
