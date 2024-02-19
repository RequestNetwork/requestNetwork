import { getDefaultProvider } from '@requestnetwork/payment-detection';
import { providers, Wallet } from 'ethers';
import { ChainTypes } from '@requestnetwork/types';

export const getWallet = async ({
  chain,
  dryRun = false,
  provider,
}: {
  chain: ChainTypes.IEvmChain;
  dryRun?: boolean;
  provider?: providers.Provider;
}): Promise<Wallet> => {
  const privateKey = process.env.PRIVATE_KEY;
  if (!privateKey && !dryRun) throw new Error('env var PRIVATE_KEY is required');
  if (!provider) {
    provider = await getProvider(chain);
  }

  return dryRun
    ? Wallet.createRandom().connect(provider)
    : new Wallet(privateKey || '').connect(provider);
};

export const getProvider = async (chain: ChainTypes.IEvmChain) => {
  const chainConfig = await getChainConfig(chain?.name);
  if (chainConfig) {
    const rpc = chainConfig.rpcUrls[0]
      .replace('{ALCHEMY_API_KEY}', process.env.ALCHEMY_API_KEY || '')
      .replace('{INFURA_API_KEY}', process.env.INFURA_API_KEY || '');
    return new providers.StaticJsonRpcProvider(rpc);
  }
  return getDefaultProvider(chain);
};

const getChainConfig = async (
  chainName: string,
): Promise<{
  name: string;
  chainId: number;
  rpcUrls: string[];
} | null> => {
  try {
    const response = await fetch(`https://api.request.network/currency/chains/${chainName}`);
    return await response.json();
  } catch (e) {
    console.warn(e.message);
    return null;
  }
};
