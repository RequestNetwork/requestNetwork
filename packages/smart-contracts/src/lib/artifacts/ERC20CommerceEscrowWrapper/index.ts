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
        // Testnet deployments for testing
        sepolia: {
          address: '0x1234567890123456789012345678901234567890', // Placeholder - to be updated with actual deployment
          creationBlockNumber: 0,
        },
        goerli: {
          address: '0x2345678901234567890123456789012345678901', // Placeholder - to be updated with actual deployment
          creationBlockNumber: 0,
        },
        mumbai: {
          address: '0x3456789012345678901234567890123456789012', // Placeholder - to be updated with actual deployment
          creationBlockNumber: 0,
        },
        // TODO: Add deployment addresses for mainnet networks once deployed
        // mainnet: {
        //   address: '0x0000000000000000000000000000000000000000',
        //   creationBlockNumber: 0,
        // },
        // matic: {
        //   address: '0x0000000000000000000000000000000000000000',
        //   creationBlockNumber: 0,
        // },
      },
    },
  },
  '0.1.0',
);
