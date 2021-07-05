import { ContractArtifact } from '../..';

import { ERC20Alpha } from '../../src/types';

export const localERC20AlphaArtifact = new ContractArtifact<ERC20Alpha>(
  {
    '0.0.1': {
      abi: [],
      deployment: {
        private: {
          address: '0x38cF23C52Bb4B13F051Aec09580a2dE845a7FA35',
          creationBlockNumber: 0,
        },
      },
    },
  },
  '0.0.1',
);
