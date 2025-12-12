import { ContractArtifact } from '../../ContractArtifact';

import ABI_0_1_0 from './0.1.0.json';
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
        // Sepolia deployment
        sepolia: {
          address: '0xF81E3F293c92CaCfc0d723d2D8183e39Cc3AEdC7',
          creationBlockNumber: 9795220,
        },
        // Base Mainnet deployment
        base: {
          address: '0xBdEA0D1bcC5966192B070Fdf62aB4EF5b4420cff',
          creationBlockNumber: 29931650,
        },
        // Base Sepolia testnet deployment
        'base-sepolia': {
          address: '0xBdEA0D1bcC5966192B070Fdf62aB4EF5b4420cff',
          creationBlockNumber: 25442083,
        },
      },
    },
  },
  '0.1.0',
);
