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
          address: '0xB529f14AA8096f943177c09Ca294Ad66d2E08b1f',
          creationBlockNumber: 0,
        },
      },
    },
  },
  '0.1.0',
);
