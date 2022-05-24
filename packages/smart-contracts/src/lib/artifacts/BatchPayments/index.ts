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
          address: '0x1411CB266FCEd1587b0AA29E9d5a9Ef3Db64A9C5',
          creationBlockNumber: 0,
        },
        rinkeby: {
          address: '0xfeE3f8937Ca62DA486a4E067Ed11aA6Bc6B21b4B',
          creationBlockNumber: 10732960,
        },
      },
    },
  },
  '0.1.0',
);
