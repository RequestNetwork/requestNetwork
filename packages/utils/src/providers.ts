import { LogTypes } from '@requestnetwork/types';

import { Client, createPublicClient, defineChain, http, toHex, trim } from 'viem';
import * as chains from 'viem/chains';

type ProviderFactory = (network: string | undefined) => Client;

/**
 * @param network the network to connect to
 * @param defaultFactory the defaultFactory to use as fallback if needed
 */
type CurrentProviderFactory = (
  network: string | undefined,
  defaultFactory: ProviderFactory,
) => Client;

// TODO use
const customChains = {
  fuse: defineChain({
    id: 122,
    name: 'fuse',
    network: 'fuse',
    nativeCurrency: { name: 'FUSE', symbol: 'FUSE', decimals: 18 },
    rpcUrls: {
      default: { http: ['https://rpc.fuse.io'] },
      public: { http: ['https://rpc.fuse.io'] },
    },
  }),
  ronin: defineChain({
    id: 2020,
    name: 'ronin',
    network: 'ronin',
    nativeCurrency: { name: 'RON', symbol: 'RON', decimals: 18 },
    rpcUrls: {
      default: { http: ['https://api.roninchain.com/rpc'] },
      public: { http: ['https://api.roninchain.com/rpc'] },
    },
  }),
  tombchain: defineChain({
    id: 6969,
    name: 'tombchain',
    network: 'tombchain',
    nativeCurrency: {
      name: 'TOMB',
      symbol: 'TOMB',
      decimals: 18,
    },
    rpcUrls: {
      public: { http: ['https://rpc.tombchain.com'] },
      default: { http: ['https://rpc.tombchain.com'] },
    },
  }),
  mantle: defineChain({
    id: 5000,
    name: 'mantle',
    network: 'mantle',
    nativeCurrency: {
      name: 'MNT',
      symbol: 'MNT',
      decimals: 18,
    },
    rpcUrls: {
      public: { http: ['https://rpc.mantle.xyz/'] },
      default: { http: ['https://rpc.mantle.xyz/'] },
    },
  }),
  'mantle-testnet': defineChain({
    id: 5001,
    name: 'mantle',
    network: 'mantle',
    nativeCurrency: {
      name: 'MNT-testnet',
      symbol: 'MNT-testnet',
      decimals: 18,
    },
    rpcUrls: {
      public: { http: ['https://rpc.testnet.mantle.xyz/'] },
      default: { http: ['https://rpc.testnet.mantle.xyz/'] },
    },
  }),
  // TODO check if exist in https://github.com/wevm/viem/blob/main/src/chains/index.ts
  core: defineChain({
    id: 1116,
    name: 'core',
    network: 'core',
    nativeCurrency: { name: 'CORE', symbol: 'CORE', decimals: 18 },
    rpcUrls: {
      public: { http: ['https://rpc.coredao.org/'] },
      default: { http: ['https://rpc.coredao.org/'] },
    },
  }),
  zksyncera: defineChain({
    id: 324,
    name: 'zksyncera',
    network: 'zksyncera',
    nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
    rpcUrls: {
      public: { http: ['https://mainnet.era.zksync.io'] },
      default: { http: ['https://mainnet.era.zksync.io'] },
    },
  }),
  zksynceratestnet: defineChain({
    id: 280,
    name: 'zksynceratestnet',
    network: 'zksynceratestnet',
    nativeCurrency: { name: 'ETH-zksync-testnet', symbol: 'ETH-zksync-testnet', decimals: 18 },
    rpcUrls: {
      public: { http: ['https://testnet.era.zksync.io'] },
      default: { http: ['https://testnet.era.zksync.io'] },
    },
  }),
};

const chainNameMap: Record<string, keyof typeof chains> = {
  matic: 'polygon',
  bsctest: 'bscTestnet',
  xdai: 'gnosis',
  'arbitrum-one': 'arbitrum',
  private: 'localhost',
  alfajores: 'celoAlfajores',
  mumbai: 'polygonMumbai',
};

function defaultGetChain(name: string) {
  for (const chain of Object.values(chains)) {
    if (chain.name === name || chain.name === chainNameMap[name]) {
      return chain;
    }
  }

  throw new Error(`Chain ${name} not found`);
}

/**
 * @see getDefaultProvider
 */
const defaultProviderFactory: ProviderFactory = (
  network: string | undefined,
  getChain = defaultGetChain,
) => {
  const chain = getChain(network || 'mainnet');

  let url: string | undefined = undefined;
  // Returns environment variable override
  const envVar = process?.env ? process.env[`RN_WEB3_RPC_URL_${chain.name.toUpperCase()}`] : null;
  if (envVar) {
    url = envVar;
  }
  return createPublicClient({
    chain,
    transport: http(url),
  });
};

/**
 * Defines the behaviour to obtain a Provider for a given Network.
 * May be overridden using setProviderFactory
 */
let currentProviderFactory: CurrentProviderFactory = defaultProviderFactory;

/**
 * Override the default providerFactory, which relies mainly on Infura.
 * @param providerFactory if not specify, will reset to the default factory
 */
const setProviderFactory = (providerFactory?: CurrentProviderFactory): void => {
  currentProviderFactory = providerFactory || defaultProviderFactory;
};

/**
 * Returns a Web3 Provider for the given `network`.
 *
 * Configuration options:
 * - Specify `RN_WEB3_RPC_URL_[NETWORK]` environment variable to override the default behaviour
 * - Specify `RN_INFURA_KEY` to override the default Infura API KEY (recommended)
 * - Use `initPaymentDetectionApiKeys` to override Infura API KEY when `RN_INFURA_KEY` is not usable
 * - Use `setProviderFactory` for more complex configurations with multiple networks
 *
 * @param network the blockchain network. See https://chainid.network/chains.json `network` field for reference
 */
const getDefaultProvider = (network?: string): Client => {
  return currentProviderFactory(network, defaultProviderFactory);
};

const isEip1559Supported = async (client: Client, logger?: LogTypes.ILogger): Promise<boolean> => {
  try {
    await client.request({
      method: 'eth_feeHistory',
      params: [trim(toHex(1)), 'latest', []],
    });
    return true;
  } catch (e) {
    logger &&
      logger.warn(
        'This RPC provider does not support the "eth_feeHistory" method: switching to legacy gas price',
      );
    return false;
  }
};

export { setProviderFactory, isEip1559Supported, getDefaultProvider };
