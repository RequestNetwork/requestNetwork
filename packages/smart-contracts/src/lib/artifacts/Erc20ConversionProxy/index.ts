import { ContractArtifact } from '../../ContractArtifact';

import { abi as ABI_0_1_0 } from './0.1.0.json';
import { abi as ABI_0_1_1 } from './0.1.1.json';
// @ts-ignore Cannot find module
import type { Erc20ConversionProxy } from '../../../types';

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
        goerli: {
          address: '0x493d6cBeE0142c73eE5461fA92CaC94e3e75df62',
          creationBlockNumber: 7091387,
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
        fantom: {
          address: '0xf0f49873C50765239F6f9534Ba13c4fe16eD5f2E',
          creationBlockNumber: 20061367,
        },
        celo: {
          address: '0xf0f49873C50765239F6f9534Ba13c4fe16eD5f2E',
          creationBlockNumber: 10141033,
        },
        'arbitrum-rinkeby': {
          address: '0xf0f49873C50765239F6f9534Ba13c4fe16eD5f2E',
          creationBlockNumber: 8403930,
        },
        /**
         * FIXME: The contract was deployed on networks below with ABI 0.1.1
         * The ABI for payments is the same, only administration tasks change.
         *  */
        'arbitrum-one': {
          address: '0xA5186dec7dC1ec85B42A3cd2Dc8289e248530B07',
          creationBlockNumber: 5321045,
        },
        avalanche: {
          address: '0xA5186dec7dC1ec85B42A3cd2Dc8289e248530B07',
          creationBlockNumber: 11671967,
        },
        /**
         * FIXME: The contract was deployed on networks below with ABI 0.1.2
         * The ABI for payments is the same, only administration tasks change.
         *  */
        bsc: {
          address: '0xbbd9c5D112343A4Aa2bc194245760CaeeaF118Be',
          creationBlockNumber: 16361281,
        },
        optimism: {
          address: '0x1550A8C4F4E5afC67Ea07e8ac590fdcAdB4bBfb1',
          creationBlockNumber: 35490589,
        },
        moonbeam: {
          address: '0x1550A8C4F4E5afC67Ea07e8ac590fdcAdB4bBfb1',
          creationBlockNumber: 2415439,
        },
        // Deployed via deployer
        sepolia: {
          address: '0xaD61121DAfAAe495095Cd466022b519Cb7503a4E',
          creationBlockNumber: 4733467,
        },
        base: {
          address: '0x8296D56321cf207925a7804E5A8E3F579838e6Ad',
          creationBlockNumber: 10827277,
        },
      },
    },
    '0.1.1': {
      abi: ABI_0_1_1,
      deployment: {
        private: {
          address: '0xdE5491f774F0Cb009ABcEA7326342E105dbb1B2E',
          creationBlockNumber: 0,
        },
        // Not used on mainnet
        mainnet: {
          address: '0x1550A8C4F4E5afC67Ea07e8ac590fdcAdB4bBfb1',
          creationBlockNumber: 14448345,
        },
        /**
         * The contract on networks below is used as ABI 0.1.0 (cf. above)
         */
        'arbitrum-one': {
          address: '0xA5186dec7dC1ec85B42A3cd2Dc8289e248530B07',
          creationBlockNumber: 5321045,
        },
        avalanche: {
          address: '0xA5186dec7dC1ec85B42A3cd2Dc8289e248530B07',
          creationBlockNumber: 11671967,
        },
      },
    },
    '0.1.2': {
      abi: ABI_0_1_1,
      deployment: {
        bsc: {
          address: '0xbbd9c5D112343A4Aa2bc194245760CaeeaF118Be',
          creationBlockNumber: 16361281,
        },
        optimism: {
          address: '0x1550A8C4F4E5afC67Ea07e8ac590fdcAdB4bBfb1',
          creationBlockNumber: 35490589,
        },
        moonbeam: {
          address: '0x1550A8C4F4E5afC67Ea07e8ac590fdcAdB4bBfb1',
          creationBlockNumber: 2415439,
        },
        sepolia: {
          address: '0xaD61121DAfAAe495095Cd466022b519Cb7503a4E',
          creationBlockNumber: 4733467,
        },
        base: {
          address: '0x8296D56321cf207925a7804E5A8E3F579838e6Ad',
          creationBlockNumber: 10827277,
        },
      },
    },
  },
  '0.1.0',
);
