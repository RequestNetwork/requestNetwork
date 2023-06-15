import { ContractArtifact } from '../../ContractArtifact';

import { abi as ABI_0_1_0 } from './0.1.0.json';
import { abi as ABI_0_2_0 } from './0.2.0.json';
// @ts-ignore Cannot find module
import type { ERC20TransferableReceivable } from '../../../types/ERC20TransferableReceivable';

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
        },
      },
    },
    '0.2.0',
  );
