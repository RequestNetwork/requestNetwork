import { HardhatRuntimeEnvironment } from 'hardhat/types';
import deployRequest from './test-deploy-request-storage';

// Deploys storage contracts
export default async function deployStorage(_args: any, hre: HardhatRuntimeEnvironment) {
  await deployRequest(_args, hre);
}
