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
          address: '0x8273e4B8ED6c78e252a9fCa5563Adfcc75C91b2A',
          creationBlockNumber: 0,
        },
        rinkeby: {
          address: '0xCa3353a15fCb5C83a1Ff64BFf055781aC5c4d2F4',
          creationBlockNumber: 9447194,
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
          address: '0x8273e4B8ED6c78e252a9fCa5563Adfcc75C91b2A',
          creationBlockNumber: 0,
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
        /* All the contracts below have not been updated with 0.2.0 yet */
        mainnet: {
          address: '0xCa3353a15fCb5C83a1Ff64BFf055781aC5c4d2F4',
          creationBlockNumber: 13765042,
        },
      },
    },
  },
  '0.2.0',
);
