import type { Contract } from 'ethers';
import { ContractArtifact } from '../../ContractArtifact';

import { abi as ABI_0_1_0 } from './0.1.0.json';
import { abi as ABI_0_2_0 } from './0.2.0.json';

export const erc20RecurringPaymentProxyArtifact = new ContractArtifact<Contract>(
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
        base: {
          address: '0xd2c3392e3e70F4CE033Cb39CC80B414aDdD64fFa',
          creationBlockNumber: 32422496,
        },
      },
    },
    '0.2.0': {
      abi: ABI_0_2_0,
      deployment: {
        sepolia: {
          address: '0xD7b1553ffE25491377a505f97f92cc44427D80A0',
          creationBlockNumber: 11570049,
        },
        mainnet: {
          address: '0xeA8c5cc64A1C9E323209D12243822c31BeaDeD91',
          creationBlockNumber: 25873673,
        },
        matic: {
          address: '0xa58a5bf7F70c14eD1804192643c68201C541681c',
          creationBlockNumber: 92972393,
        },
        base: {
          address: '0xDc8781fFAb20Fef4aB0472c3d6E50073B540Ed9e',
          creationBlockNumber: 50685271,
        },
        optimism: {
          address: '0x368d9F4cEb9bbF06d1fF89dfE304c5dCfb7C0aed',
          creationBlockNumber: 156281770,
        },
        'arbitrum-one': {
          address: '0xE4e709F30d9c8b0a8923d18DEF6Ae6ac979E7Ad1',
          creationBlockNumber: 500229938,
        },
        bsc: {
          address: '0xED8D28Ae27800e06d477F630421a3170676A5244',
          creationBlockNumber: 119119329,
        },
      },
    },
  },
  '0.2.0',
);
