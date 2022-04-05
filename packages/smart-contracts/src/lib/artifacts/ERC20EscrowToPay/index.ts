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
          address: '0xC4B9a5271e3Ffe01AAc3c1428Ea430695D0bCD3d',
          creationBlockNumber: 0,
        },
        mainnet: {
          address: '',
          creationBlockNumber: 0,
        },
        rinkeby: {
          address: '0xff1CAe28E5a5B199CCBaae5257B118372095Aa26',
          creationBlockNumber: 10417067,
        },
      },
    },
  },
  '0.1.0',
);
