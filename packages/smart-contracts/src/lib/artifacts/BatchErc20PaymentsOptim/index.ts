import { ContractArtifact } from '../../ContractArtifact';

import { abi as ABI_0_1_0 } from './0.1.0.json';
// @ts-ignore Cannot find module
import type { BatchErc20PaymentsOptim } from '../../../types/BatchErc20PaymentsOptim';

export const batchErc20PaymentsOptimArtifact = new ContractArtifact<BatchErc20PaymentsOptim>(
  {
    '0.1.0': {
      abi: ABI_0_1_0,
      deployment: {
        private: {
          address: '0xBd2c938B9F6Bfc1A66368D08CB44dC3EB2aE27bE',
          creationBlockNumber: 0,
        },
        rinkeby: {
          address: '0xeAF3C6Ad5Cd66f8F4B1F7a435Cba1f151ef806F4',
          creationBlockNumber: 10304487,
        },
      },
    },
  },
  '0.1.0',
);
