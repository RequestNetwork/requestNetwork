import { ethers } from 'ethers';

const networks: Record<string, ethers.providers.Network> = {
  sokol: { chainId: 77, name: 'sokol' },
  fuse: { chainId: 122, name: 'fuse' },
  celo: { chainId: 42220, name: 'celo' },
  fantom: { chainId: 250, name: 'fantom' },
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
        return `https://blockscout.com/poa/${this.network.name}`;
      case 'fuse':
        return 'https://explorer.fuse.io';
      case 'celo':
        return 'https://explorer.celo.org';
      case 'matic':
        return 'https://api.polygonscan.com';
      case 'fantom':
        return 'https://api.ftmscan.com';
      case 'bsctest':
        return 'https://api-testnet.bscscan.com/';
      // Near
      case 'aurora':
        return 'https://explorer.mainnet.near.org';
      case 'aurora-testnet':
        return 'https://explorer.testnet.near.org';
      default:
        return super.getBaseUrl();
    }
  }
}
