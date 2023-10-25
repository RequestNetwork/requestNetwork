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
        goerli: {
          address: '0xe11BF2fDA23bF0A98365e1A4c04A87C9339e8687',
          creationBlockNumber: 7091386,
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
        bsc: {
          address: '0xC6E23a20C0a1933ACC8E30247B5D1e2215796C1F',
          creationBlockNumber: 16165026,
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
        goerli: {
          address: '0xe11BF2fDA23bF0A98365e1A4c04A87C9339e8687',
          creationBlockNumber: 7091386,
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
        celo: {
          address: '0xfCFBcfc4f5A421089e3Df45455F7f4985FE2D6a8',
          creationBlockNumber: 11988955,
        },
        ronin: {
          address: '0xe9cbD1Aa5496628F4302426693Ad63006C56959F',
          creationBlockNumber: 18379590,
        },
        optimism: {
          address: '0xe11BF2fDA23bF0A98365e1A4c04A87C9339e8687',
          creationBlockNumber: 34638587,
        },
        moonbeam: {
          address: '0xe11BF2fDA23bF0A98365e1A4c04A87C9339e8687',
          creationBlockNumber: 2415490,
        },
        tombchain: {
          address: '0xe11BF2fDA23bF0A98365e1A4c04A87C9339e8687',
          creationBlockNumber: 2951047,
        },
        mantle: {
          address: '0xe11BF2fDA23bF0A98365e1A4c04A87C9339e8687',
          creationBlockNumber: 127944,
        },
        'mantle-testnet': {
          address: '0xe11BF2fDA23bF0A98365e1A4c04A87C9339e8687',
          creationBlockNumber: 16210081,
        },
        core: {
          address: '0xe11BF2fDA23bF0A98365e1A4c04A87C9339e8687',
          creationBlockNumber: 8317446,
        },
      },
    },
  },
  '0.2.0',
);
