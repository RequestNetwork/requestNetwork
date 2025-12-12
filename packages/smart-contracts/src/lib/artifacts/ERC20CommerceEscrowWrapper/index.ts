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
          address: '0xc9b2eCBc2bfb38908f0Ee59729875959A09E6Ea5',
          creationBlockNumber: 9822153,
        },
        // Mainnet deployments
        base: {
          address: '0x9A73b3774183d07d4a2b585B04982F2Ec672B03b',
          creationBlockNumber: 39363932,
        },
      },
    },
  },
  '0.1.0',
);
