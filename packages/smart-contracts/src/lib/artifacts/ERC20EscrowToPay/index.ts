import { ContractArtifact } from '../../ContractArtifact';

import { abi as ABI_0_1_0 } from './0.1.0.json';
// @ts-ignore Cannot find module
import type { ERC20EscrowToPay } from '../../../types/ERC2EscrowToPay';

export const erc20EscrowToPayArtifact = new ContractArtifact<ERC20EscrowToPay>(
  {
    '0.1.0': {
      abi: ABI_0_1_0,
      deployment: {
        private: {
          address: '0x74e3FC764c2474f25369B9d021b7F92e8441A2Dc',
          creationBlockNumber: 0,
        },
        mainnet: {
          address: '',
          creationBlockNumber: 0,
        },
        rinkeby: {
          address: '0x8230e703B1c4467A4543422b2cC3284133B9AB5e',
          creationBlockNumber: 9669613,
        },
      },
    },
  },
  '0.1.0',
);
