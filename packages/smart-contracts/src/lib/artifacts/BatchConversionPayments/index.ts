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
          address: '0x3cc064751F99b27f20c6888A25A28E0edAA7e85a',
          creationBlockNumber: 11269864,
        },
      },
    },
  },
  '0.1.0',
);
