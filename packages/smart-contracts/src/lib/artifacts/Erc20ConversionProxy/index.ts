import { ContractArtifact } from '../../ContractArtifact';

import { abi as ABI_0_1_0 } from './0.1.0.json';
import type { Erc20ConversionProxy } from '../../../types/Erc20ConversionProxy';

export const erc20ConversionProxy = new ContractArtifact<Erc20ConversionProxy>(
  {
    '0.1.0': {
      abi: ABI_0_1_0,
      deployment: {
        private: {
          address: '0xB9B7e0cb2EDF5Ea031C8B297A5A1Fa20379b6A0a',
          creationBlockNumber: 0,
        },
        mainnet: {
          address: '0xe72Ecea44b6d8B2b3cf5171214D9730E86213cA2',
          creationBlockNumber: 12225751,
        },
        rinkeby: {
          address: '0x78334ed20da456e89cd7e5a90de429d705f5bc88',
          creationBlockNumber: 8014584,
        },
      },
    },
  },
  '0.1.0',
);
