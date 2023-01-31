import axios from 'axios';

type ChainConfig = {
  name: string;
  chainId: number;
  rpcUrls: string[];
};

const cachedChainConfigs: Record<string, ChainConfig> = {};

export const getChainConfig = async (chainName: string) => {
  try {
    if (cachedChainConfigs[chainName]) return cachedChainConfigs[chainName];
    const { data } = await axios.get<ChainConfig>(
      `https://api.request.network/currency/chains/${chainName}`,
    );
    cachedChainConfigs[chainName] = data;
    return data;
  } catch (e) {
    console.warn(e.message);
    return null;
  }
};
