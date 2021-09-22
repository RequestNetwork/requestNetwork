import { ContractArtifact } from '../../ContractArtifact';

import { abi as ABI_0_1_0 } from './0.1.0.json';
import type { EthereumFeeProxy } from '../../../types/EthereumFeeProxy';

export const ethereumFeeProxyArtifact = new ContractArtifact<EthereumFeeProxy>(
  {
    '0.2.0': {
      abi: ABI_0_1_0,
      deployment: {
        private: {
          address: '0x3d49d1eF2adE060a33c6E6Aa213513A7EE9a6241',
          creationBlockNumber: 0,
        },
      },
    },
  },
  '0.2.0',
);
