import { ContractArtifact } from '../../ContractArtifact';

import { abi as ABI_0_1_0 } from './0.1.0.json';
// @ts-ignore Cannot find module
import type { EthereumProxy } from '../../../types/EthereumProxy';

export const ethereumProxyArtifact = new ContractArtifact<EthereumProxy>(
  {
    '0.1.0': {
      abi: ABI_0_1_0,
      deployment: {
        private: {
          address: '0xf204a4Ef082f5c04bB89F7D5E6568B796096735a',
          creationBlockNumber: 0,
        },
        mainnet: {
          address: '0x37a8f5f64f2a84f2377481537f04d2a59c9f59b6',
          creationBlockNumber: 9466832,
        },
        rinkeby: {
          address: '0x9c6c7817e3679c4b3f9ef9486001eae5aaed25ff',
          creationBlockNumber: 5955681,
        },
        xdai: {
          address: '0x27c60BE17e853c47A9F1d280B05365f483c2dFAF',
          creationBlockNumber: 18326895,
        },
        bsctest: {
          address: '0x27c60BE17e853c47A9F1d280B05365f483c2dFAF',
          creationBlockNumber: 11540170,
        },
        fantom: {
          address: '0x27c60BE17e853c47A9F1d280B05365f483c2dFAF',
          creationBlockNumber: 20060175,
        },
        matic: {
          address: '0x27c60BE17e853c47A9F1d280B05365f483c2dFAF',
          creationBlockNumber: 17427737,
        },
        celo: {
          address: '0x27c60BE17e853c47A9F1d280B05365f483c2dFAF',
          creationBlockNumber: 10141029,
        },
      },
    },
    '0.2.0': {
      abi: ABI_0_1_0,
      deployment: {
        private: {
          address: '0xf204a4Ef082f5c04bB89F7D5E6568B796096735a',
          creationBlockNumber: 0,
        },
        mainnet: {
          address: '0x27c60BE17e853c47A9F1d280B05365f483c2dFAF',
          creationBlockNumber: 13764023,
        },
        rinkeby: {
          address: '0x27c60BE17e853c47A9F1d280B05365f483c2dFAF',
          creationBlockNumber: 9447186,
        },
        xdai: {
          address: '0x27c60BE17e853c47A9F1d280B05365f483c2dFAF',
          creationBlockNumber: 18326895,
        },
        bsctest: {
          address: '0x27c60BE17e853c47A9F1d280B05365f483c2dFAF',
          creationBlockNumber: 11540170,
        },
        fantom: {
          address: '0x27c60BE17e853c47A9F1d280B05365f483c2dFAF',
          creationBlockNumber: 20060175,
        },
        matic: {
          address: '0x27c60BE17e853c47A9F1d280B05365f483c2dFAF',
          creationBlockNumber: 17427737,
        },
        celo: {
          address: '0x27c60BE17e853c47A9F1d280B05365f483c2dFAF',
          creationBlockNumber: 10141029,
        },
        arbitrumtestnet: {
          address: '0x27c60BE17e853c47A9F1d280B05365f483c2dFAF',
          creationBlockNumber: 8403917,
        },
      },
    },
  },
  '0.2.0',
);
