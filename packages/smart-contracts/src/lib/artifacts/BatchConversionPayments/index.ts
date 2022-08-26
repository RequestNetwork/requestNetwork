import { ContractArtifact } from '../../ContractArtifact';

import { abi as ABI_0_1_0 } from './0.1.0.json';
// @ts-ignore Cannot find module
import type { BatchConversionPayments } from '../../../types/BatchConversionPayments';

export const batchConversionPaymentsArtifact = new ContractArtifact<BatchConversionPayments>(
  {
    '0.1.0': {
      abi: ABI_0_1_0,
      deployment: {
        private: {
          address: '0x2e335F247E91caa168c64b63104C4475b2af3942',
          creationBlockNumber: 0,
        },
        rinkeby: {
          address: '0x9E8DC5b7Dd6F6a38d9736Ee80Ed6561094E6460a',
          creationBlockNumber: 11269756,
        },
      },
    },
  },
  '0.1.0',
);
