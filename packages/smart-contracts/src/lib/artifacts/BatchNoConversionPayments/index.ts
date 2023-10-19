import { ContractArtifact } from '../../ContractArtifact.js';

import { abi as ABI_0_1_0 } from './0.1.0.json';
// @ts-ignore Cannot find module
import type { BatchNoConversionPayments } from '../../../types/BatchNoConversionPayments.js';

export const batchNoConversionPaymentsArtifact = new ContractArtifact<BatchNoConversionPayments>(
  {
    '0.1.0': {
      abi: ABI_0_1_0,
      deployment: {
        private: {
          address: '0x1411CB266FCEd1587b0AA29E9d5a9Ef3Db64A9C5',
          creationBlockNumber: 0,
        },
      },
    },
  },
  '0.1.0',
);
