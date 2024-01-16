import { ContractArtifact } from '../../ContractArtifact';

import { abi as ABI_0_1_0 } from './0.1.0.json';

/**
 * Doesn't store the Safe interface.
 * Only used to maintain the list of RN Safe administrating the contracts across supported chains
 */
export const safeAdminArtifact = new ContractArtifact<any>(
  {
    '0.1.0': {
      abi: ABI_0_1_0,
      deployment: {
        mainnet: {
          address: '0x8b138Eb490aBbbB11B8AD6Ae127E7ceBff7E848D',
          creationBlockNumber: 1,
        },
        matic: {
          address: '0xC8cBFf73a29a2c7D9280955B266ffe2BA77d77Ba',
          creationBlockNumber: 1,
        },
      },
    },
  },
  '0.1.0',
);
