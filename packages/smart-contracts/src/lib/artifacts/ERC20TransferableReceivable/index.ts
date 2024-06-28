import { ContractArtifact } from '../../ContractArtifact';

import { abi as ABI_0_1_0 } from './0.1.0.json';
import { abi as ABI_0_2_0 } from './0.2.0.json';
// @ts-ignore Cannot find module
import type { ERC20TransferableReceivable } from '../../../types';

export const erc20TransferableReceivableArtifact =
  new ContractArtifact<ERC20TransferableReceivable>(
    {
      '0.1.0': {
        abi: ABI_0_1_0,
        deployment: {
          private: {
            address: '0xF426505ac145abE033fE77C666840063757Be9cd',
            creationBlockNumber: 0,
          },
          goerli: {
            address: '0xC2AC172a293d68f548ea343414584aA37eb29Dcd',
            creationBlockNumber: 8502503,
          },
          matic: {
            address: '0xA9930c8e4638D9a96a3B73e7ABe73a636F986323',
            creationBlockNumber: 39364680,
          },
          mainnet: {
            address: '0x6278949d3b4C10569BEB696Ff8864B5c772c740d',
            creationBlockNumber: 16642905,
          },
        },
      },
      '0.2.0': {
        abi: ABI_0_2_0,
        deployment: {
          private: {
            address: '0xF426505ac145abE033fE77C666840063757Be9cd',
            creationBlockNumber: 0,
          },
          goerli: {
            address: '0x6fb42f5826045e96171664e0E540818134F5431f',
            creationBlockNumber: 9333948,
          },
          matic: {
            address: '0xd6C04C5d0e561D94B15622e770045776D4ce3739',
            creationBlockNumber: 45005575,
          },
          mainnet: {
            address: '0xcE80D17d38cfee8E5E6c682F7712bfb5A04Ae912',
            creationBlockNumber: 17735969,
          },
          sepolia: {
            address: '0xB5E53C3d145Cbaa61C7028736A1fF0bC6817A4c5',
            creationBlockNumber: 6194071,
          },
        },
      },
    },
    '0.2.0',
  );
