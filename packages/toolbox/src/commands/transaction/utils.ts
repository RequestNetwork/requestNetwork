import { getDefaultProvider } from '@requestnetwork/payment-detection';
import { providers, Wallet } from 'ethers';
import axios from 'axios';

export const getWallet = async ({
  chainName,
  dryRun = false,
  provider,
}: {
  chainName: string;
  dryRun?: boolean;
  provider?: providers.Provider;
}): Promise<Wallet> => {
  const privateKey = process.env.PRIVATE_KEY;
  if (!privateKey && !dryRun) throw new Error('env var PRIVATE_KEY is required');
  if (!provider) {
    provider = await getProvider(chainName);
  }

  return dryRun
    ? Wallet.createRandom().connect(provider)
    : new Wallet(privateKey || '').connect(provider);
};

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export const getProvider = async (chainName: string) => {
  const chain = await getChainConfig(chainName);
  if (chain) {
    const rpc = chain.rpcUrls[0].replace('{INFURA_API_KEY}', process.env.INFURA_API_KEY || '');
    return new providers.StaticJsonRpcProvider(rpc);
  }
  return getDefaultProvider(chainName);
};

const getChainConfig = async (chainName: string) => {
  try {
    const { data } = await axios.get<{
      name: string;
      chainId: number;
      rpcUrls: string[];
    }>(`https://api.request.network/currency/chains/${chainName}`);
    return data;
  } catch (e) {
    console.warn(e.message);
    return null;
  }
};
