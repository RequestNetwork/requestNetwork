import { ContractArtifact } from '../../ContractArtifact';

import { abi as ABI_0_1_0 } from './0.1.0.json';
import { abi as ABI_0_2_0 } from './0.2.0.json';
// @ts-ignore Cannot find module
import type { ERC20SwapToPay } from '../../../types';

export const erc20SwapToPayArtifact = new ContractArtifact<ERC20SwapToPay>(
  {
    '0.2.0': {
      abi: ABI_0_1_0,
      deployment: {
        private: {
          address: '0xA4392264a2d8c998901D10C154C91725b1BF0158',
          creationBlockNumber: 0,
        },
        mainnet: {
          address: '0x6691E334525b41A26C7398dbdC3c1e68fb3A7898',
          creationBlockNumber: 11053751,
        },
        rinkeby: {
          address: '0xb674e3d228e631594D8fd4BF947E1811288bf836',
          creationBlockNumber: 7363204,
        },
        goerli: {
          address: '0x0Ef49176A87Adcc88bD5125126C6a6c23a28303C',
          creationBlockNumber: 7109102,
        },
      },
    },
    '0.3.0': {
      abi: ABI_0_1_0,
      deployment: {
        private: {
          address: '0xA4392264a2d8c998901D10C154C91725b1BF0158',
          creationBlockNumber: 0,
        },
        mainnet: {
          address: '0x8433ed02a32154aa0edbae12b1c8816205d6d02c',
          creationBlockNumber: 11099206,
        },
        rinkeby: {
          address: '0x1B5077Ca852d39CDDeDaF45FAF1235841854420b',
          creationBlockNumber: 7408086,
        },
        goerli: {
          address: '0x0Ef49176A87Adcc88bD5125126C6a6c23a28303C',
          creationBlockNumber: 7109102,
        },
        bsc: {
          address: '0x75740D9b5cA3BCCb356CA7f0D0dB71aBE427a835',
          creationBlockNumber: 16165020,
        },
        bsctest: {
          address: '0x75740D9b5cA3BCCb356CA7f0D0dB71aBE427a835',
          creationBlockNumber: 12759707,
        },
        fantom: {
          address: '0x75740D9b5cA3BCCb356CA7f0D0dB71aBE427a835',
          creationBlockNumber: 20066418,
        },
        matic: {
          address: '0x75740D9b5cA3BCCb356CA7f0D0dB71aBE427a835',
          creationBlockNumber: 20670324,
        },
        celo: {
          address: '0x75740D9b5cA3BCCb356CA7f0D0dB71aBE427a835',
          creationBlockNumber: 10141034,
        },
        'arbitrum-one': {
          address: '0x75740D9b5cA3BCCb356CA7f0D0dB71aBE427a835',
          creationBlockNumber: 5317940,
        },
        avalanche: {
          address: '0x75740D9b5cA3BCCb356CA7f0D0dB71aBE427a835',
          creationBlockNumber: 11671643,
        },
        optimism: {
          address: '0x75740D9b5cA3BCCb356CA7f0D0dB71aBE427a835',
          creationBlockNumber: 35479213,
        },
        moonbeam: {
          address: '0x75740D9b5cA3BCCb356CA7f0D0dB71aBE427a835',
          creationBlockNumber: 2415419,
        },
      },
    },
    '0.4.0': {
      abi: ABI_0_2_0,
      deployment: {
        private: {
          address: '0xA4392264a2d8c998901D10C154C91725b1BF0158',
          creationBlockNumber: 0,
        },
        goerli: {
          address: '0x626e6E3dac82205EA5FfB526092F4DCe525E46a9',
          creationBlockNumber: 8345195,
        },
        mainnet: {
          address: '0x626e6E3dac82205EA5FfB526092F4DCe525E46a9',
          creationBlockNumber: 16449207,
        },
        matic: {
          address: '0x626e6E3dac82205EA5FfB526092F4DCe525E46a9',
          creationBlockNumber: 38315947,
        },
        celo: {
          address: '0x626e6E3dac82205EA5FfB526092F4DCe525E46a9',
          creationBlockNumber: 17312915,
        },
        xdai: {
          address: '0x626e6E3dac82205EA5FfB526092F4DCe525E46a9',
          creationBlockNumber: 26061999,
        },
        avalanche: {
          address: '0x626e6E3dac82205EA5FfB526092F4DCe525E46a9',
          creationBlockNumber: 25191333,
        },
        optimism: {
          address: '0x626e6E3dac82205EA5FfB526092F4DCe525E46a9',
          creationBlockNumber: 69320020,
        },
        moonbeam: {
          address: '0x626e6E3dac82205EA5FfB526092F4DCe525E46a9',
          creationBlockNumber: 2771649,
        },
        fantom: {
          address: '0x626e6E3dac82205EA5FfB526092F4DCe525E46a9',
          creationBlockNumber: 54083939,
        },
        bsc: {
          address: '0x626e6E3dac82205EA5FfB526092F4DCe525E46a9',
          creationBlockNumber: 24955402,
        },
        'arbitrum-one': {
          address: '0x626e6E3dac82205EA5FfB526092F4DCe525E46a9',
          creationBlockNumber: 54331555,
        },
        fuse: {
          address: '0x626e6E3dac82205EA5FfB526092F4DCe525E46a9',
          creationBlockNumber: 21337989,
        },
        sepolia: {
          address: '0x626e6E3dac82205EA5FfB526092F4DCe525E46a9',
          creationBlockNumber: 4733365,
        },
        base: {
          address: '0x78384dB9674109A3Edf9F2814eFF4B6fc25D816A',
          creationBlockNumber: 10827281,
        },
      },
    },
  },
  '0.4.0',
);
