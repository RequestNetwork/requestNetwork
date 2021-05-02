import { ContractArtifact } from '../../ContractArtifact';

import { abi as ABI_0_1_0 } from './0.1.0.json';
import type { ERC20SwapToPay } from '../../../types/ERC20SwapToPay';

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
      },
    },
  },
  '0.3.0',
);
