import { HardhatRuntimeEnvironment } from 'hardhat/types';

// Deploys, set up the contracts
export default async function deployDeployer(hre: HardhatRuntimeEnvironment): Promise<void> {
  try {
    const [deployer] = await hre.ethers.getSigners();

    // Deploy the contract RequestDeployer
    const RequestDeployer__factory = await hre.ethers.getContractFactory(
      'RequestDeployer',
      deployer,
    );
    const RequestDeployer = await RequestDeployer__factory.deploy();

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
