import { ContractArtifact } from '../../ContractArtifact';

import { abi as ABI_0_1_0 } from './0.1.0.json';
// @ts-ignore Cannot find module
import type { BatchPayments } from '../../../types/BatchPayments';

export const batchPaymentsArtifact = new ContractArtifact<BatchPayments>(
  {
    '0.1.0': {
      abi: ABI_0_1_0,
      deployment: {
        private: {
          address: '0x2a504B5e7eC284ACa5b6f49716611237239F0b97',
          creationBlockNumber: 0,
        },
        rinkeby: {
          address: '0xD02C5E6D86BA8D72eac9a71c9cF11263e181e6FD',
          creationBlockNumber: 10292043,
        },
      },
    },
  },
  '0.1.0',
);