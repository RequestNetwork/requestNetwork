import { ContractArtifact } from '../../ContractArtifact';

import { abi as ABI_0_1_0 } from './0.1.0.json';
import { abi as ABI_0_2_0 } from './0.2.0.json';
// @ts-ignore Cannot find module
import type { ERC20SwapToConversion } from '../../../types';

export const erc20SwapConversionArtifact = new ContractArtifact<ERC20SwapToConversion>(
  {
    '0.1.0': {
      abi: ABI_0_1_0,
      deployment: {
        private: {
          address: '0xd54b47F8e6A1b97F3A84f63c867286272b273b7C',
          creationBlockNumber: 0,
        },
        rinkeby: {
          address: '0x1d6B06C6f7adFd9314BD4C58a6D306261113a1D4',
          creationBlockNumber: 9447192,
        },
        bsc: {
          address: '0x1d6B06C6f7adFd9314BD4C58a6D306261113a1D4',
          creationBlockNumber: 16165023,
        },
        bsctest: {
          address: '0x1d6B06C6f7adFd9314BD4C58a6D306261113a1D4',
          creationBlockNumber: 12759710,
        },
        fantom: {
          address: '0x1d6B06C6f7adFd9314BD4C58a6D306261113a1D4',
          creationBlockNumber: 20066424,
        },
        matic: {
          address: '0x1d6B06C6f7adFd9314BD4C58a6D306261113a1D4',
          creationBlockNumber: 20670431,
        },
        celo: {
          address: '0x1d6B06C6f7adFd9314BD4C58a6D306261113a1D4',
          creationBlockNumber: 10141036,
        },
        mainnet: {
          address: '0x1d6B06C6f7adFd9314BD4C58a6D306261113a1D4',
          creationBlockNumber: 13764156,
        },
        'arbitrum-one': {
          address: '0x1d6B06C6f7adFd9314BD4C58a6D306261113a1D4',
          creationBlockNumber: 5317947,
        },
        avalanche: {
          address: '0x1d6B06C6f7adFd9314BD4C58a6D306261113a1D4',
          creationBlockNumber: 11671649,
        },
      },
    },
    '0.2.0': {
      abi: ABI_0_2_0,
      deployment: {
        private: {
          address: '0xd54b47F8e6A1b97F3A84f63c867286272b273b7C',
          creationBlockNumber: 0,
        },
        rinkeby: {
          address: '0x3b4837C9F4A606b71e61FD56Db6241781194df92',
          creationBlockNumber: 0,
        },
        goerli: {
          address: '0x3b4837C9F4A606b71e61FD56Db6241781194df92',
          creationBlockNumber: 7091388,
        },
        matic: {
          address: '0x3b4837C9F4A606b71e61FD56Db6241781194df92',
          creationBlockNumber: 27597829,
        },
        mainnet: {
          address: '0x3b4837C9F4A606b71e61FD56Db6241781194df92',
          creationBlockNumber: 14660280,
        },
        xdai: {
          address: '0x3b4837C9F4A606b71e61FD56Db6241781194df92',
          creationBlockNumber: 21837165,
        },
        // Deployment address changed due to an update of the contract metadata
        optimism: {
          address: '0x80D1EE67ffAf7047d3E6EbF7317cF0eAd63FFc78',
          creationBlockNumber: 35496076,
        },
        moonbeam: {
          address: '0x80D1EE67ffAf7047d3E6EbF7317cF0eAd63FFc78',
          creationBlockNumber: 2415496,
        },
        // Deployment address changed due to an update of the ChainlinkConversionPath contract
        sepolia: {
          address: '0x05e94CDdd14E0b18317AE21BAFAEC24156BdB7C9',
          creationBlockNumber: 4733367,
        },
        base: {
          address: '0xFbBd0854048a8A75a8823c230e673F8331140483',
          creationBlockNumber: 10827284,
        },
      },
    },
  },
  '0.2.0',
);
