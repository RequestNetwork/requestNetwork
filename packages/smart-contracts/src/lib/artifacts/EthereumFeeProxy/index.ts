import { ContractArtifact } from '../../ContractArtifact';

import { abi as ABI_0_1_0 } from './0.1.0.json';
import type { EthereumFeeProxy } from '../../../types/EthereumFeeProxy';

export const ethereumFeeProxyArtifact = new ContractArtifact<EthereumFeeProxy>(
  {
    '0.1.0': {
      abi: ABI_0_1_0,
      deployment: {
        private: {
          address: '0x3d49d1eF2adE060a33c6E6Aa213513A7EE9a6241',
          creationBlockNumber: 0,
        },
        rinkeby: {
          address: '0xC6E23a20C0a1933ACC8E30247B5D1e2215796C1F',
          creationBlockNumber: 9447193,
        },
      },
    },
  },
  '0.1.0',
);
