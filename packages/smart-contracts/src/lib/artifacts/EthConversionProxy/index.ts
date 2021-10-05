import { ContractArtifact } from '../../ContractArtifact';

import { abi as ABI_0_1_0 } from './0.1.0.json';
import type { EthConversionProxy } from '../../../types/EthConversionProxy';

export const ethConversionArtifact = new ContractArtifact<EthConversionProxy>(
  {
    '0.1.0': {
      abi: ABI_0_1_0,
      deployment: {
        private: {
          address: '0x8273e4B8ED6c78e252a9fCa5563Adfcc75C91b2A',
          creationBlockNumber: 0,
        },
      },
    },
  },
  '0.1.0',
);
