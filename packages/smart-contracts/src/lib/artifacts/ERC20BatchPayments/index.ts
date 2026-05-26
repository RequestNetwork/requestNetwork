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
          address: 'TDnU5eY8Et3QdZRWMSTvoXQnxQeMxF7CE4',
          creationBlockNumber: 67775288,
        },
        tron: {
          address: 'TUdcGd29QpV65MkbqgBLWJKbTG3UL7PuQB',
          creationBlockNumber: 83048743,
        },
      },
    },
  },
  '0.1.0',
);
