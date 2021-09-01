import { ContractArtifact } from '../../ContractArtifact';

import { abi as ABI_0_1_0 } from './0.1.0.json';
import type { MyEscrow } from '../../../types/MyEscrow';

export const myEscrowArtifact = new ContractArtifact<MyEscrow>(
  {
    '0.1.0': {
      abi: ABI_0_1_0,
      deployment: {
        private: {
          address: '0xF08dF3eFDD854FEDE77Ed3b2E515090EEe765154',
          creationBlockNumber: 0,
        },
        mainnet: {
          address: 'TODO',
          creationBlockNumber: 10774767,
        },
        rinkeby: {
          address: 'TODO',
          creationBlockNumber: 7118080,
        },
      },
    },
  },
  '0.1.0',
);
