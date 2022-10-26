import { ContractArtifact } from '../../ContractArtifact';

import { abi as ABI_0_1_0 } from './0.1.0.json';
// @ts-ignore Cannot find module
import type { BatchConversionPayments } from '../../../types/BatchConversionPayments';

export const batchConversionPaymentsArtifact = new ContractArtifact<BatchConversionPayments>(
  {
    '0.1.0': {
      abi: ABI_0_1_0,
      deployment: {
        private: {
          address: '0x2e335F247E91caa168c64b63104C4475b2af3942',
          creationBlockNumber: 0,
        },
        goerli: {
          address: '0x0fD49d410fB50Dc1f308975E5D19B5c4551B0041',
          creationBlockNumber: 7791166,
        },
        mainnet: {
          address: '0x0fD49d410fB50Dc1f308975E5D19B5c4551B0041',
          creationBlockNumber: 15789288,
        },
        matic: {
          address: '0x0fD49d410fB50Dc1f308975E5D19B5c4551B0041',
          creationBlockNumber: 34493278,
        },
        bsc: {
          address: '0x0fD49d410fB50Dc1f308975E5D19B5c4551B0041',
          creationBlockNumber: 22280538,
        },
        celo: {
          address: '0x0fD49d410fB50Dc1f308975E5D19B5c4551B0041',
          creationBlockNumber: 15686247,
        },
        'arbitrum-one': {
          address: '0x0fD49d410fB50Dc1f308975E5D19B5c4551B0041',
          creationBlockNumber: 30957509,
        },
        fantom: {
          address: '0x0fD49d410fB50Dc1f308975E5D19B5c4551B0041',
          creationBlockNumber: 49522660,
        },
        avalanche: {
          address: '0x0fD49d410fB50Dc1f308975E5D19B5c4551B0041',
          creationBlockNumber: 21258879,
        },
        // Caution: no ETHConversion proxy on xDai
        xdai: {
          address: '0x0fD49d410fB50Dc1f308975E5D19B5c4551B0041',
          creationBlockNumber: 24654730,
        },
        // Caution: no ERC20Conversion proxy on fuse
        fuse: {
          address: '0x0fD49d410fB50Dc1f308975E5D19B5c4551B0041',
          creationBlockNumber: 19732873,
        },
      },
    },
  },
  '0.1.0',
);
