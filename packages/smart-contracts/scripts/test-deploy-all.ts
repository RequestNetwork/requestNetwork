import { HardhatRuntimeEnvironment } from 'hardhat/types';
import deployRequest from './test-deploy-request-storage';
import deployPayment from './test-deploy-main-payments';
import deployConversion from './test-deploy_chainlink_contract';
import { deployEscrow } from './test-deploy-escrow-deployment';
import { deployBatchPayment } from './test-deploy-batch-erc-eth-deployment';
import { deploySuperFluid } from './test-deploy-superfluid';
import { deployBatchConversionPayment } from './test-deploy-batch-conversion-deployment';
import { deployERC20TransferableReceivable } from './test-deploy-erc20-transferable-receivable';
import { deploySingleRequestProxyFactory } from './test-deploy-single-request-proxy';

// Deploys, set up the contracts
export default async function deploy(_args: any, hre: HardhatRuntimeEnvironment): Promise<any> {
  await deployRequest(_args, hre);
  const mainPaymentAddresses = await deployPayment(_args, hre);
  await deployConversion(_args, hre, mainPaymentAddresses);
  await deployEscrow(hre);
  await deployBatchPayment(_args, hre);
  await deploySuperFluid(hre);
  await deployBatchConversionPayment(_args, hre);
  await deployERC20TransferableReceivable(_args, hre, mainPaymentAddresses);
  await deploySingleRequestProxyFactory(_args, hre, mainPaymentAddresses);
}
