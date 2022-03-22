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
          address: '0x74e3FC764c2474f25369B9d021b7F92e8441A2Dc',
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
