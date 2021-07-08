import { ethers } from 'ethers';

const networks: Record<string, ethers.providers.Network> = {
  sokol: { chainId: 77, name: 'sokol' },
  fuse: { chainId: 122, name: 'fuse' },
  celo: { chainId: 42220, name: 'celo' },
};

/**
 * A provider that supports multiple APIs, like Etherscan and Blockscout
 */
export class MultichainApiProvider extends ethers.providers.EtherscanProvider {
  constructor(network?: ethers.providers.Networkish, apiKey?: string) {
    if (typeof network === 'string' && networks[network]) {
      network = networks[network];
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
      default:
        return super.getBaseUrl();
    }
  }
}
