import { deployContract } from './utils-zk';
import { erc20FeeProxyArtifact, ethereumFeeProxyArtifact } from '../src/lib';
/**
 * Deploys SingleRequestProxyFactory to zkSync network.
 * This script is supposed to be run with the deploy-zksync plugin
 */
export default async function () {
  console.log('Deploying SingleRequestProxyFactory to zkSync ...');

  const ownerAddress = process.env.ADMIN_WALLET_ADDRESS;

  if (!ownerAddress) {
    throw new Error('ADMIN_WALLET_ADDRESS is not set');
  }

  const ethereumFeeProxy = ethereumFeeProxyArtifact.getAddress('zksyncera');
  const erc20FeeProxy = erc20FeeProxyArtifact.getAddress('zksyncera');

  await deployContract('SingleRequestProxyFactory', [
    ethereumFeeProxy,
    erc20FeeProxy,
    ownerAddress,
  ]);
}
