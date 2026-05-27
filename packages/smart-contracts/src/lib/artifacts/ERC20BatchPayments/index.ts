import { ContractArtifact } from '../../ContractArtifact';

import { abi as ABI_0_1_0 } from './0.1.0.json';
// @ts-ignore Cannot find module
import type { ERC20BatchPayments } from '../../../types/tron';

export const erc20BatchPaymentsArtifact = new ContractArtifact<ERC20BatchPayments>(
  {
    tron: {
      abi: ABI_0_1_0,
      deployment: {
        nile: {
          address: 'TC6nD547PRDVWuX8hBMREU7vVvSZNCAZot',
          creationBlockNumber: 63208782,
        },
        tron: {
          address: 'THm8vX6GNfRFZ15mRqdgvj56wjB6575S7C',
          creationBlockNumber: 83068367,
        },
      },
    },
  },
  '0.1.0',
);
