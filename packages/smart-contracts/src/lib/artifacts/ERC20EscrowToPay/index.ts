import { ContractArtifact } from '../../ContractArtifact';

import { abi as ABI_0_1_0 } from './0.1.0.json';
import type { ERC20EscrowToPay } from '../../../types/ERC20EscrowToPay';

export const ERC20EscrowToPayArtifact = new ContractArtifact<ERC20EscrowToPay>(
  {
    '0.1.0': {
      abi: ABI_0_1_0,
      deployment: {
        private: {
          address: '0xF08dF3eFDD854FEDE77Ed3b2E515090EEe765154',
          creationBlockNumber: 0,
        },
        mainnet: {
          address: 'TODO: Add mainnet address when contract is deployed',
          creationBlockNumber: 10774767,
        },
        rinkeby: {
          address: 'TODO: Add rinkeby address when contract is deployed',
          creationBlockNumber: 9221352,
        },
      },
    },
  },
  '0.1.0',
);
