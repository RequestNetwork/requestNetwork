import { ContractArtifact } from '../../ContractArtifact';

import { abi as ABI_0_1_0 } from './0.1.0.json';
// @ts-ignore Cannot find module
import type { ERC20BatchPayments } from '../../../types';

export const erc20BatchPaymentsArtifact = new ContractArtifact<ERC20BatchPayments>(
  {
    tron: {
      abi: ABI_0_1_0,
      deployment: {
        nile: {
          address: 'TBAtFt46T7LUW5Sya6PNjw7MQrKkzKEFMx',
          creationBlockNumber: 67830042,
        },
        tron: {
          address: 'TRZbXXuLd3HW5utzVysA3rpLgU7sVBrd1D',
          creationBlockNumber: 83104290,
        },
      },
    },
  },
  '0.1.0',
);
