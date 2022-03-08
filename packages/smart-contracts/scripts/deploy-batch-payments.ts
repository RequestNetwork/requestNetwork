import { HardhatRuntimeEnvironment } from 'hardhat/types';
import deployPayment from './2_deploy-main-payments';

// Deploys, set up the contracts
export default async function deployBatchPayments(_args: any, hre: HardhatRuntimeEnvironment) {
  await deployPayment(_args, hre);
}
