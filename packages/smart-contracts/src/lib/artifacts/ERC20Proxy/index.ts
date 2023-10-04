import { ContractArtifact } from '../../ContractArtifact';

import { abi as ABI_0_1_0 } from './0.1.0.json';
// @ts-ignore Cannot find module
import type { ERC20Proxy } from '../../../types';

export const erc20ProxyArtifact = new ContractArtifact<ERC20Proxy>(
  {
    '0.1.0': {
      abi: ABI_0_1_0,
      deployment: {
        private: {
          address: '0x2c2b9c9a4a25e24b174f26114e8926a9f2128fe4',
          creationBlockNumber: 0,
        },
        mainnet: {
          address: '0x5f821c20947ff9be22e823edc5b3c709b33121b3',
          creationBlockNumber: 9119380,
        },
        rinkeby: {
          address: '0x162edb802fae75b9ee4288345735008ba51a4ec9',
          creationBlockNumber: 5628198,
        },
        mantle: {
          address: '0x88Ecc15fDC2985A7926171B938BB2Cd808A5ba40',
          creationBlockNumber: 127947,
        },
        'mantle-testnet': {
          address: '0x88Ecc15fDC2985A7926171B938BB2Cd808A5ba40',
          creationBlockNumber: 16210085,
        },
      },
    },
  },
  '0.1.0',
);
