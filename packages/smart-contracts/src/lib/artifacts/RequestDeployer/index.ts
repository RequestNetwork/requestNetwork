import { ContractArtifact } from '../../ContractArtifact';

import { abi as ABI_0_1_0 } from './0.1.0.json';
// @ts-ignore Cannot find module
import type { RequestDeployer } from '../../../types/RequestDeployer';

export const requestDeployer = new ContractArtifact<RequestDeployer>(
  {
    '0.1.0': {
      abi: ABI_0_1_0,
      deployment: {
        private: {
          address: '0x8CdaF0CD259887258Bc13a92C0a6dA92698644C0',
          creationBlockNumber: 0,
        },
        mainnet: {
          address: '0xE99Ab70a5FAE59551544FA326fA048f7B95A24B2',
          creationBlockNumber: 14391311,
        },
        rinkeby: {
          address: '0xE99Ab70a5FAE59551544FA326fA048f7B95A24B2',
          creationBlockNumber: 10307305,
        },
        goerli: {
          address: '0xE99Ab70a5FAE59551544FA326fA048f7B95A24B2',
          creationBlockNumber: 7068867,
        },
        'arbitrum-rinkeby': {
          address: '0xE99Ab70a5FAE59551544FA326fA048f7B95A24B2',
          creationBlockNumber: 10382055,
        },
        'arbitrum-one': {
          address: '0xE99Ab70a5FAE59551544FA326fA048f7B95A24B2',
          creationBlockNumber: 7933954,
        },
        fantom: {
          address: '0xE99Ab70a5FAE59551544FA326fA048f7B95A24B2',
          creationBlockNumber: 33483971,
        },
        matic: {
          address: '0xE99Ab70a5FAE59551544FA326fA048f7B95A24B2',
          creationBlockNumber: 25967123,
        },
        celo: {
          address: '0xE99Ab70a5FAE59551544FA326fA048f7B95A24B2',
          creationBlockNumber: 1195388,
        },
        bsc: {
          address: '0xE99Ab70a5FAE59551544FA326fA048f7B95A24B2',
          creationBlockNumber: 16079576,
        },
        xdai: {
          address: '0xE99Ab70a5FAE59551544FA326fA048f7B95A24B2',
          creationBlockNumber: 21121759,
        },
        fuse: {
          address: '0xE99Ab70a5FAE59551544FA326fA048f7B95A24B2',
          creationBlockNumber: 15991043,
        },
        avalanche: {
          address: '0xE99Ab70a5FAE59551544FA326fA048f7B95A24B2',
          creationBlockNumber: 12141146,
        },
        optimism: {
          address: '0xE99Ab70a5FAE59551544FA326fA048f7B95A24B2',
          creationBlockNumber: 34281084,
        },
        moonbeam: {
          address: '0xE99Ab70a5FAE59551544FA326fA048f7B95A24B2',
          creationBlockNumber: 2415122,
        },
        tombchain: {
          address: '0xE99Ab70a5FAE59551544FA326fA048f7B95A24B2',
          creationBlockNumber: 2950756,
        },
        mantle: {
          address: '0xE99Ab70a5FAE59551544FA326fA048f7B95A24B2',
          creationBlockNumber: 119284,
        },
        'mantle-testnet': {
          address: '0xE99Ab70a5FAE59551544FA326fA048f7B95A24B2',
          creationBlockNumber: 16208647,
        },
      },
    },
  },
  '0.1.0',
);
