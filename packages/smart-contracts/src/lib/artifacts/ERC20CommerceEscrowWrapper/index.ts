import { ContractArtifact } from '../../ContractArtifact';

import { abi as ABI_0_1_0 } from './0.1.0.json';
// @ts-ignore Cannot find module
import type { ERC20CommerceEscrowWrapper } from '../../../types';

export const erc20CommerceEscrowWrapperArtifact = new ContractArtifact<ERC20CommerceEscrowWrapper>(
  {
    '0.1.0': {
      abi: ABI_0_1_0,
      deployment: {
        private: {
          address: '0x0000000000000000000000000000000000000000', // Placeholder - to be updated with actual deployment
          creationBlockNumber: 0,
        },
        // Testnet deployments
        sepolia: {
          address: '0x0000000000000000000000000000000000000000', // Placeholder - to be updated with Create2 deployment
          creationBlockNumber: 0,
        },
        // Mainnet deployments
        base: {
          address: '0x0000000000000000000000000000000000000000', // Placeholder - to be updated with Create2 deployment
          creationBlockNumber: 0,
        },
      },
    },
  },
  '0.1.0',
);
