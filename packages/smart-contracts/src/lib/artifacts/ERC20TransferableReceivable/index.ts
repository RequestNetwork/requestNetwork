import { ContractArtifact } from '../../ContractArtifact';

import { abi as ABI_0_1_0 } from './0.1.0.json';
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
        },
      },
    },
    '0.1.0',
  );
