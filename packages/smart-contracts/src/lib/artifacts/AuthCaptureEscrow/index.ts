import { ContractArtifact } from '../../ContractArtifact';

import { abi as ABI_0_1_0 } from './0.1.0.json';
// @ts-ignore Cannot find module
import type { AuthCaptureEscrow } from '../../../types';

export const authCaptureEscrowArtifact = new ContractArtifact<AuthCaptureEscrow>(
  {
    '0.1.0': {
      abi: ABI_0_1_0,
      deployment: {
        private: {
          address: '0x0000000000000000000000000000000000000000',
          creationBlockNumber: 0,
        },
        // Base Sepolia deployment (same address as mainnet via CREATE2)
        sepolia: {
          address: '0xBdEA0D1bcC5966192B070Fdf62aB4EF5b4420cff',
          creationBlockNumber: 0,
        },
        // Base Mainnet deployment (same address as sepolia via CREATE2)
        base: {
          address: '0xBdEA0D1bcC5966192B070Fdf62aB4EF5b4420cff',
          creationBlockNumber: 0,
        },
      },
    },
  },
  '0.1.0',
);
