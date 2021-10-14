import { ContractArtifact } from '../../ContractArtifact';

import { abi as ABI_0_1_0 } from './0.1.0.json';
import { ERC20EscrowToPay } from '../../../types/ERC20EscrowToPay';

export const erc20EscrowToPayArtifact = new ContractArtifact<ERC20EscrowToPay>(
  {
    '0.1.0': {
      abi: ABI_0_1_0,
      deployment: {
        private: {
          address: '0xdDA6327139485221633A1FcD65f4aC932E60A2e1',
          creationBlockNumber: 0,
        },
        mainnet: {
          address: '',
          creationBlockNumber: 10774767,
        },
        rinkeby: {
          address: '',
          creationBlockNumber: 7118080,
        },
      },
    },
  },
  '0.1.0',
);
