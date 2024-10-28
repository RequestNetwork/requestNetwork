import { ContractArtifact } from '../../ContractArtifact';

import { abi as ABI_0_1_0 } from './0.1.0.json';

import type { SingleRequestProxyFactory } from '../../../types';

export const singleRequestProxyFactoryArtifact = new ContractArtifact<SingleRequestProxyFactory>(
  {
    '0.1.0': {
      abi: ABI_0_1_0,
      deployment: {
        private: {
          address: '0x9d075ae44D859191C121d7522da0Cc3B104b8837',
          creationBlockNumber: 0,
        },
        sepolia: {
          address: '0x435E81E12136414e2c09cAFe05E902E23bD46030',
          creationBlockNumber: 6965557,
        },
      },
    },
  },
  '0.1.0',
);
