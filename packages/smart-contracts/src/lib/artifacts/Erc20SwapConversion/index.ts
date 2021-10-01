import { ContractArtifact } from '../../ContractArtifact';

import { abi as ABI_0_1_0 } from './0.1.0.json';
import type { ERC20SwapToConversion } from '../../../types/ERC20SwapToConversion';

export const erc20SwapConversionArtifact = new ContractArtifact<ERC20SwapToConversion>(
  {
    '0.1.0': {
      abi: ABI_0_1_0,
      deployment: {
        private: {
          address: '0xd54b47F8e6A1b97F3A84f63c867286272b273b7C',
          creationBlockNumber: 0,
        },
        mainnet: {
          address: 'TODO',
          creationBlockNumber: 0,
        },
        rinkeby: {
          address: '0x38443a9501F20C3bf2BDff14244665F3aEC86bA2',
          creationBlockNumber: 8884276,
        },
        bsctest: {
          address: '0x1d6B06C6f7adFd9314BD4C58a6D306261113a1D4',
          creationBlockNumber: 12759710,
        },
      },
    },
  },
  '0.1.0',
);
