import { ethers } from 'ethers';

const networks: Record<string, ethers.providers.Network> = {
  sokol: { chainId: 77, name: 'sokol' },
  fuse: { chainId: 122, name: 'fuse' },
  celo: { chainId: 42220, name: 'celo' },
  fantom: { chainId: 250, name: 'fantom' },
  'arbitrum-rinkeby': { chainId: 421611, name: 'arbitrum-rinkeby' },
  'arbitrum-one': { chainId: 42161, name: 'arbitrum-one' },
  avalanche: { chainId: 43114, name: 'avalanche' },
  bsc: { chainId: 56, name: 'bsc' },
  optimism: { chainId: 10, name: 'optimism' },
  moonbeam: { chainId: 1284, name: 'moonbeam' },
  tombchain: { chainId: 6969, name: 'tombchain' },
  mantle: { chainId: 5000, name: 'mantle' },
  'mantle-testnet': { chainId: 5001, name: 'mantle-testnet' },
  core: { chainId: 1116, name: 'core' },
  zkSyncEraTestnet: { chainId: 280, name: 'zkSyncEraTestnet' },
  zkSyncEra: { chainId: 324, name: 'zkSyncEra' },
};

/**
 * A provider that supports multiple APIs, like Etherscan and Blockscout
 */
export class MultichainExplorerApiProvider extends ethers.providers.EtherscanProvider {
  constructor(network?: ethers.providers.Networkish, apiKey?: string) {
    if (typeof network === 'string' && networks[network]) {
      network = networks[network];
    }
    if (!apiKey && (network === 'mainnet' || network === 'rinkeby')) {
      apiKey = 'TCVQQU5V39TAS1V6HF61P9K7IJZVEHH1D9';
    }
    super(network, apiKey);
  }

  getBaseUrl(): string {
    switch (this.network.name) {
      case 'sokol':
      case 'xdai':
        return 'https://api.gnosisscan.io';
      case 'fuse':
        return 'https://explorer.fuse.io';
      case 'celo':
        return 'https://api.celoscan.io';
      case 'matic':
        return 'https://api.polygonscan.com';
      case 'fantom':
        return 'https://api.ftmscan.com';
      case 'bsctest':
        return 'https://api-testnet.bscscan.com/';
      case 'bsc':
        return 'https://api.bscscan.com/';
      // Near
      case 'aurora':
        return 'https://explorer.mainnet.near.org';
      case 'aurora-testnet':
      case 'near-testnet':
        return 'https://explorer.testnet.near.org';
      case 'arbitrum-rinkeby':
        return 'https://testnet.arbiscan.io/';
      case 'arbitrum-one':
        return 'https://api.arbiscan.io';
      case 'avalanche':
        return 'https://api.snowtrace.io';
      case 'mantle':
        return 'https://explorer.mantle.xyz/api';
      case 'mantle-testnet':
        return 'https://explorer.testnet.mantle.xyz/api';
      case 'core':
        return 'https://openapi.coredao.org/';
      case 'zkSyncEraTestnet':
        return 'https://goerli.explorer.zksync.io/';
      case 'zkSyncEra':
        return 'https://explorer.zksync.io/';
      default:
        return super.getBaseUrl();
    }
  }
}
