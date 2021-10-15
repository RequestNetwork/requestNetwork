import { ContractArtifact } from '../../ContractArtifact';

import { abi as ABI_0_1_0 } from './0.1.0.json';
import { ERC20EscrowToPay } from '../../../types/ERC20EscrowToPay';

export const erc20EscrowToPayArtifact = new ContractArtifact<ERC20EscrowToPay>(
  {
    '0.1.0': {
      abi: ABI_0_1_0,
      deployment: {
        private: {
          address: '0x82D50AD3C1091866E258Fd0f1a7cC9674609D254',
          creationBlockNumber: 0,
        },
        mainnet: {
          address: 'TODO',
          creationBlockNumber: 0,
        },
        rinkeby: {
          address: 'TODO',
          creationBlockNumber: 0,
        },
      },
    },
  },
  '0.1.0',
);
