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
        'arbitrum-rinkeby': {
          address: '0xC6E23a20C0a1933ACC8E30247B5D1e2215796C1F',
          creationBlockNumber: 8403946,
        },
        'arbitrum-one': {
          address: '0xC6E23a20C0a1933ACC8E30247B5D1e2215796C1F',
          creationBlockNumber: 5317955,
        },
        avalanche: {
          address: '0xC6E23a20C0a1933ACC8E30247B5D1e2215796C1F',
          creationBlockNumber: 11671666,
        },
      },
    },
    '0.2.0': {
      abi: ABI_0_1_0,
      deployment: {
        private: {
          address: '0x3d49d1eF2adE060a33c6E6Aa213513A7EE9a6241',
          creationBlockNumber: 0,
        },
        rinkeby: {
          address: '0xfCFBcfc4f5A421089e3Df45455F7f4985FE2D6a8',
          creationBlockNumber: 10307582,
        },
        fantom: {
          address: '0xfCFBcfc4f5A421089e3Df45455F7f4985FE2D6a8',
          creationBlockNumber: 33495801,
        },
        avalanche: {
          address: '0xfCFBcfc4f5A421089e3Df45455F7f4985FE2D6a8',
          creationBlockNumber: 12144016,
        },
        fuse: {
          address: '0xfCFBcfc4f5A421089e3Df45455F7f4985FE2D6a8',
          creationBlockNumber: 15992819,
        },
        matic: {
          address: '0xfCFBcfc4f5A421089e3Df45455F7f4985FE2D6a8',
          creationBlockNumber: 25972999,
        },
        xdai: {
          address: '0xfCFBcfc4f5A421089e3Df45455F7f4985FE2D6a8',
          creationBlockNumber: 21123997,
        },
        'arbitrum-one': {
          address: '0xfCFBcfc4f5A421089e3Df45455F7f4985FE2D6a8',
          creationBlockNumber: 7943516,
        },
        bsc: {
          address: '0xfCFBcfc4f5A421089e3Df45455F7f4985FE2D6a8',
          creationBlockNumber: 16084639,
        },
        mainnet: {
          address: '0xfCFBcfc4f5A421089e3Df45455F7f4985FE2D6a8',
          creationBlockNumber: 14392218,
        },
      },
    },
  },
  '0.2.0',
);
