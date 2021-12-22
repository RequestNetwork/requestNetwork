import { ContractArtifact } from '../../ContractArtifact';

import { abi as ABI_0_1_0 } from './0.1.0.json';
// @ts-ignore Cannot find module
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
        fantom: {
          address: '0xC6E23a20C0a1933ACC8E30247B5D1e2215796C1F',
          creationBlockNumber: 20066431,
        },
        matic: {
          address: '0xC6E23a20C0a1933ACC8E30247B5D1e2215796C1F',
          creationBlockNumber: 20670475,
        },
        celo: {
          address: '0xC6E23a20C0a1933ACC8E30247B5D1e2215796C1F',
          creationBlockNumber: 10141037,
        },
        mainnet: {
          address: '0xC6E23a20C0a1933ACC8E30247B5D1e2215796C1F',
          creationBlockNumber: 13764157,
        },
      },
    },
  },
  '0.1.0',
);
