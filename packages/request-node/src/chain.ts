import { Chain, defineChain } from 'viem';
import * as config from './config';
import { getEthereumStorageNetworkNameFromId } from '@requestnetwork/ethereum-storage';
import { hashSubmitterContracts } from './contracts';

export const getChain = (): Chain => {
  const chainId = config.getStorageNetworkId();
  const network = getEthereumStorageNetworkNameFromId(chainId);
  if (!network) {
    throw new Error(`Storage network not supported: ${chainId}`);
  }
  const hashSubmitter = hashSubmitterContracts[chainId];
  if (!hashSubmitter) {
    throw new Error(`No hash submitter configuration found for ${chainId}`);
  }
  const rpcUrl = config.getStorageWeb3ProviderUrl();

  const rpc = { http: [rpcUrl] };
  return defineChain({
    name: network,
    network,
    id: chainId === 0 ? 1337 : chainId,
    nativeCurrency: { decimals: 18, name: 'Ether', symbol: 'ETH' },
    rpcUrls: { default: rpc, public: rpc },
    contracts: { hashSubmitter },
  });
};
