import hre from 'hardhat';
import deployRequest from './1_deploy-request-storage';
import deployPayment from './2_deploy-main-payments';
import deployConversion from './3_deploy_chainlink_contract';

export default async () => {
  const args = { network: 'private', force: true };
  await deployRequest(args, hre);
  await deployPayment(args, hre);
  await deployConversion(args, hre);
};
