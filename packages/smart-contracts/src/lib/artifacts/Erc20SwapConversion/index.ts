import { ContractArtifact } from '../../ContractArtifact';

import { abi as ABI_0_1_0 } from './0.1.0.json';
import type { ERC20SwapToConversion } from '../../../types/ERC20SwapToConversion';

export const erc20SwapConversionArtifact = new ContractArtifact<ERC20SwapToConversion>(
  {
    '0.1.0': {
      abi: ABI_0_1_0,
      deployment: {
        private: {
          address: '0xdE5491f774F0Cb009ABcEA7326342E105dbb1B2E',
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
      },
    },
  },
  '0.1.0',
);
