import { ContractArtifact } from '../../ContractArtifact';

import { abi as ABI_0_1_0 } from './0.1.0.json';
import { abi as ABI_0_2_0 } from './0.2.0.json';
import { abi as ABI_0_2_1 } from './0.2.1.json';
// @ts-ignore Cannot find module
import type { EthConversionProxy } from '../../../types';

export const ethConversionArtifact = new ContractArtifact<EthConversionProxy>(
  {
    '0.1.0': {
      abi: ABI_0_1_0,
      deployment: {
        private: {
          address: '0x98d9f9e8DEbd4A632682ba207670d2a5ACD3c489',
          creationBlockNumber: 0,
        },
        rinkeby: {
          address: '0xCa3353a15fCb5C83a1Ff64BFf055781aC5c4d2F4',
          creationBlockNumber: 9447194,
        },
        goerli: {
          address: '0xED250D9219EB93098Bb67aEbc992963172B9c8DA',
          creationBlockNumber: 7108896,
        },
        fantom: {
          address: '0xCa3353a15fCb5C83a1Ff64BFf055781aC5c4d2F4',
          creationBlockNumber: 20066436,
        },
        matic: {
          address: '0xCa3353a15fCb5C83a1Ff64BFf055781aC5c4d2F4',
          creationBlockNumber: 20670503,
        },
        celo: {
          address: '0xCa3353a15fCb5C83a1Ff64BFf055781aC5c4d2F4',
          creationBlockNumber: 10141038,
        },
        mainnet: {
          address: '0xCa3353a15fCb5C83a1Ff64BFf055781aC5c4d2F4',
          creationBlockNumber: 13765042,
        },
      },
    },
    '0.2.0': {
      abi: ABI_0_2_0,
      deployment: {
        private: {
          address: '0x98d9f9e8DEbd4A632682ba207670d2a5ACD3c489',
          creationBlockNumber: 0,
        },
        mainnet: {
          address: '0x7Ebf48a26253810629C191b56C3212Fd0D211c26',
          creationBlockNumber: 14448211,
        },
        rinkeby: {
          address: '0x7Ebf48a26253810629C191b56C3212Fd0D211c26',
          creationBlockNumber: 10023415,
        },
        goerli: {
          address: '0xED250D9219EB93098Bb67aEbc992963172B9c8DA',
          creationBlockNumber: 7108896,
        },
        fantom: {
          address: '0x7Ebf48a26253810629C191b56C3212Fd0D211c26',
          creationBlockNumber: 28552915,
        },
        'arbitrum-one': {
          address: '0x7Ebf48a26253810629C191b56C3212Fd0D211c26',
          creationBlockNumber: 5317986,
        },
        avalanche: {
          address: '0x7Ebf48a26253810629C191b56C3212Fd0D211c26',
          creationBlockNumber: 11671704,
        },
        matic: {
          address: '0x7Ebf48a26253810629C191b56C3212Fd0D211c26',
          creationBlockNumber: 25999653,
        },
        celo: {
          address: '0x7Ebf48a26253810629C191b56C3212Fd0D211c26',
          creationBlockNumber: 11969006,
        },
        bsc: {
          address: '0x7Ebf48a26253810629C191b56C3212Fd0D211c26',
          creationBlockNumber: 16170265,
        },
        optimism: {
          address: '0x7Ebf48a26253810629C191b56C3212Fd0D211c26',
          creationBlockNumber: 30490295,
        },
        moonbeam: {
          address: '0x7Ebf48a26253810629C191b56C3212Fd0D211c26',
          creationBlockNumber: 2415431,
        },
        /**
         * The contract was deployed on networks below with ABI 0.2.1
         * The ABI for payments is the same, only administration tasks change.
         */
        sepolia: {
          address: '0xc861aE0Cd70b73b0C8F1D62Fa669E6D1d7D7e0aB',
          creationBlockNumber: 4733362,
        },
        base: {
          address: '0xEdfD8386d5DE52072B4Ad8dC69BBD0bB89f9A1fb',
          creationBlockNumber: 10827267,
        },
        xdai: {
          address: '0x3E3B04e1bF170522a5c5DDE628C4d365c0342239',
          creationBlockNumber: 35929105,
        },
      },
    },
    '0.2.1': {
      abi: ABI_0_2_1,
      deployment: {
        // Implements additional admin functions
        sepolia: {
          address: '0xc861aE0Cd70b73b0C8F1D62Fa669E6D1d7D7e0aB',
          creationBlockNumber: 4733362,
        },
        base: {
          address: '0xEdfD8386d5DE52072B4Ad8dC69BBD0bB89f9A1fb',
          creationBlockNumber: 10827267,
        },
        xdai: {
          address: '0x3E3B04e1bF170522a5c5DDE628C4d365c0342239',
          creationBlockNumber: 35929105,
        },
      },
    },
  },
  '0.2.0',
);
