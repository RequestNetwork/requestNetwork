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
          address: '0xF08dF3eFDD854FEDE77Ed3b2E515090EEe765154',
          creationBlockNumber: 0,
        },
        mainnet: {
          address: '',
          creationBlockNumber: 0,
        },
        rinkeby: {
          address: '0xEbe28A2B7336670Ba752bfEad4a121D2c4FF2464',
          creationBlockNumber: 10461945,
        },
      },
    },
  },
  '0.1.0',
);
