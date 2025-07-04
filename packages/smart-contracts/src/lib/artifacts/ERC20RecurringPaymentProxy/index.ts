import { ContractArtifact } from '../../ContractArtifact';

import { abi as ABI_0_1_0 } from './0.1.0.json';

import type { ERC20RecurringPaymentProxy } from '../../../types';

export const erc20RecurringPaymentProxyArtifact = new ContractArtifact<ERC20RecurringPaymentProxy>(
  {
    '0.1.0': {
      abi: ABI_0_1_0,
      deployment: {
        private: {
          address: '0xd8672a4A1bf37D36beF74E36edb4f17845E76F4e',
          creationBlockNumber: 0,
        },
        sepolia: {
          address: '0xb6C7448458d8616B00eb8f93883d0081Fa2aDec9',
          creationBlockNumber: 8689800,
        },
        matic: {
          address: '0xD3BD678f219439c2bcf602Beb07e601a91b8Cd3d',
          creationBlockNumber: 73564289,
        },
        'arbitrum-one': {
          address: '0xC335f956e91faa1DC103f9B54f7009c470dc6EEf',
          creationBlockNumber: 354140859,
        },
        bsc: {
          address: '0xbb0f20890E9e405f9D4c2e707590525ccAA3De16',
          creationBlockNumber: 52840120,
        },
        xdai: {
          address: '0xC82f76682E16fD2f030A010785a870e6fC6Ad1D1',
          creationBlockNumber: 40915683,
        },
        mainnet: {
          address: '0xF0Bebbc99E26Ba7F651E7Ff14e0D3029B0228880',
          creationBlockNumber: 22845710,
        },
      },
    },
  },
  '0.1.0',
);
