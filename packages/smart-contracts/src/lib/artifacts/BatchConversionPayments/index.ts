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
          address: '0x42c466ccF141A8EBE0Aa2ECEF06A4f4BE9a9B526',
          creationBlockNumber: 11338182,
        },
        goerli: {
          address: '0x42c466ccF141A8EBE0Aa2ECEF06A4f4BE9a9B526',
          creationBlockNumber: 7546738,
        },
        matic: {
          address: '0x42c466ccF141A8EBE0Aa2ECEF06A4f4BE9a9B526',
          creationBlockNumber: 32800551,
        },
      },
    },
  },
  '0.1.0',
);
