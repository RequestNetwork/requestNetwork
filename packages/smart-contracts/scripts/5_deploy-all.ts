import { HardhatRuntimeEnvironment } from 'hardhat/types';
import deployRequest from './1_deploy-request-storage';
import deployPayment from './2_deploy-main-payments';
import deployConversion from './3_deploy_chainlink_contract';
import { deployEscrow } from './4_deploy-escrow-deployment';

// Deploys, set up the contracts
export default async function deploy(_args: any, hre: HardhatRuntimeEnvironment) {
    await deployRequest(_args, hre)
    const mainPaymentAddresses = await deployPayment(_args, hre)
    await deployConversion(_args, hre, mainPaymentAddresses)        
    await deployEscrow(hre)
}
