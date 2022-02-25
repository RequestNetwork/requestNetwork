import { ContractArtifact } from '../../ContractArtifact';

import { abi as ABI_0_1_0 } from './0.1.0.json';
// @ts-ignore Cannot find module
import type { ERC20SwapToPayWithFees } from '../../../types/ERC20SwapToPayWithFees';

export const erc20SwapToPayWithFeesArtifact = new ContractArtifact<ERC20SwapToPayWithFees>(
  {
    '0.1.0': {
      abi: ABI_0_1_0,
      deployment: {
        private: {
          address: '0xA4392264a2d8c998901D10C154C91725b1BF0158',
          creationBlockNumber: 0,
        },
      },
    },
  },
  '0.1.0',
);
