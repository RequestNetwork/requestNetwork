import '@nomiclabs/hardhat-ethers';
import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { deployOne } from '../scripts/deploy-one';

// Deploys, set up the contracts
export async function deployRequestApps(hre: HardhatRuntimeEnvironment): Promise<void> {
  const openHashSubmitterAddress = '0xf25186b5081ff5ce73482ad761db0eb0d25abfbf';
  try {
    // Deploy Escrow contract
    const requestAppRegistry = await deployOne({}, hre, 'RequestAppRegistry');
    const { address: requestCreatorAddress } = await deployOne({}, hre, 'RequestCreator', {
      constructorArguments: [requestAppRegistry.address, openHashSubmitterAddress],
    });
    const { address: requestSplitAddress } = await deployOne({}, hre, 'RequestCreator', {
      constructorArguments: [requestAppRegistry.address, openHashSubmitterAddress],
    });

    // ----------------------------------
    console.log('Contracts deployed');
    console.log(`
      RequestAppRegistry:         ${requestAppRegistry.address}
      RequestCreator:             ${requestCreatorAddress}
      RequestSplit:               ${requestSplitAddress}
    `);
  } catch (e) {
    console.error(e);
  }
}
