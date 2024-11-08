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
          address: '0xf8cACE7EE4c03Eb4f225434B0709527938D365b4',
          creationBlockNumber: 7038199,
        },
        zksyncera: {
          address: '0xC52F0f36b4f0Cdf55D4349640C32929c5E85Ab1a',
          creationBlockNumber: 48467338,
        },
      },
    },
  },
  '0.1.0',
);
