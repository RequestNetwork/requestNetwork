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
          address: '0x305164cC3846E6e631A77D4FD632219643A8767E',
          creationBlockNumber: 10492237,
        },
      },
    },
  },
  '0.1.0',
);
