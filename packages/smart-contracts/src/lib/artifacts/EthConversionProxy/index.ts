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
        rinkeby: {
          address: '0xCa3353a15fCb5C83a1Ff64BFf055781aC5c4d2F4',
          creationBlockNumber: 9447194,
        },
      },
    },
  },
  '0.1.0',
);
