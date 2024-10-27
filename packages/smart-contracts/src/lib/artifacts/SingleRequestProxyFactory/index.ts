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
          address: '0x38faB0379D2D5e8120980597F1b0a443A8Ebc2AD',
          creationBlockNumber: 6922054,
        },
      },
    },
  },
  '0.1.0',
);
