import { ContractArtifact } from '../../ContractArtifact';

import { abi as ABI_0_1_0 } from './0.1.0.json';
// @ts-ignore Cannot find module
import type { Erc20ConversionProxy } from '../../../types/Erc20ConversionProxy';

export const erc20ConversionProxy = new ContractArtifact<Erc20ConversionProxy>(
  {
    '0.1.0': {
      abi: ABI_0_1_0,
      deployment: {
        private: {
          address: '0xdE5491f774F0Cb009ABcEA7326342E105dbb1B2E',
          creationBlockNumber: 0,
        },
        mainnet: {
          address: '0xe72Ecea44b6d8B2b3cf5171214D9730E86213cA2',
          creationBlockNumber: 12225751,
        },
        rinkeby: {
          address: '0x78334ed20da456e89cd7e5a90de429d705f5bc88',
          creationBlockNumber: 8014584,
        },
        matic: {
          address: '0xf0f49873C50765239F6f9534Ba13c4fe16eD5f2E',
          creationBlockNumber: 17427747,
        },
        xdai: {
          address: '0xf0f49873C50765239F6f9534Ba13c4fe16eD5f2E',
          creationBlockNumber: 18326898,
        },
        bsctest: {
          address: '0xf0f49873C50765239F6f9534Ba13c4fe16eD5f2E',
          creationBlockNumber: 12759699,
        },
        bsc: {
          address: '0xf0f49873C50765239F6f9534Ba13c4fe16eD5f2E',
          creationBlockNumber: 11540180,
        },
        fantom: {
          address: '0xf0f49873C50765239F6f9534Ba13c4fe16eD5f2E',
          creationBlockNumber: 20061367,
        },
        celo: {
          address: '0xf0f49873C50765239F6f9534Ba13c4fe16eD5f2E',
          creationBlockNumber: 10141033,
        },
      },
    },
  },
  // Additional deployments of same versions, not worth upgrading the version number but worth using within next versions
  /*
  '0.1.0-next': {
    abi: ABI_0_1_0,
    deployment: {
      mainnet: {
        address: '0xf0f49873C50765239F6f9534Ba13c4fe16eD5f2E',
        creationBlockNumber: 13764028,
      },
    },
  },
  */
  '0.1.0',
);
