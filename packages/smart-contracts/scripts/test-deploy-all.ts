import { HardhatRuntimeEnvironment } from 'hardhat/types';
import deployRequest from './test-deploy-request-storage';
import deployPayment from './test-deploy-main-payments';
import deployConversion from './test-deploy_chainlink_contract';
import { deployEscrow } from './test-deploy-escrow-deployment';
import { deploySuperFluid } from './test-deploy-superfluid';
import { deployBatchConversionPayment } from './test-deploy-batch-conversion-deployment';

// Deploys, set up the contracts
export default async function deploy(_args: any, hre: HardhatRuntimeEnvironment): Promise<any> {
  await deployRequest(_args, hre);
  const mainPaymentAddresses = await deployPayment(_args, hre);
  await deployConversion(_args, hre, mainPaymentAddresses);
  await deployEscrow(hre);
  await deploySuperFluid(hre);
  await deployBatchConversionPayment(_args, hre);
}
