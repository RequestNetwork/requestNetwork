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
          address: '0xF17B277E0E3FC584dA6f50E8C46B2E8F1c9b951b',
          creationBlockNumber: 11729088,
        },
        mainnet: {
          address: '0xbd43EDecA92d4c4721F6EecaD347516f9DeB0711',
          creationBlockNumber: 26002785,
        },
        matic: {
          address: '0x04a118727287a1588DA09dE054a9AcaD66Bd99Dc',
          creationBlockNumber: 94007691,
        },
        base: {
          address: '0xDdd4328fe040E44B8445e2dD2D9518c56CE4b07d',
          creationBlockNumber: 51463809,
        },
        optimism: {
          address: '0x72B79b40e3e9F883FBff3ec30D4a2372489a95ed',
          creationBlockNumber: 157059296,
        },
        'arbitrum-one': {
          address: '0xBB9835Ecea4967AA7Dc06241cEA20323ddA8f1D5',
          creationBlockNumber: 506369721,
        },
        bsc: {
          address: '0x322e3e9553a497434A68791e60BAFD2972597e3D',
          creationBlockNumber: 122570929,
        },
      },
    },
  },
  '0.2.0',
);
