import { ContractArtifact } from '../../ContractArtifact';

import { abi as ABI_0_1_0 } from './0.1.0.json';
// @ts-ignore Cannot find module
import type { RequestDeployer } from '../../../types/RequestDeployer';

export const requestDeployer = new ContractArtifact<RequestDeployer>(
  {
    '0.1.0': {
      abi: ABI_0_1_0,
      deployment: {
        private: {
          address: '0x8CdaF0CD259887258Bc13a92C0a6dA92698644C0',
          creationBlockNumber: 0,
        },
      },
    },
  },
  '0.1.0',
);
