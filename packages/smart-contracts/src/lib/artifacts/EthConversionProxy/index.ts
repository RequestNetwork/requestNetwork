import { ContractArtifact } from '../../ContractArtifact';

import { abi as ABI_0_1_0 } from './0.1.0.json';
import { abi as ABI_0_2_0 } from './0.2.0.json';
// @ts-ignore Cannot find module
import type { EthConversionProxy } from '../../../types/EthConversionProxy';

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
      },
    },
  },
  '0.2.0',
);
