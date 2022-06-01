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
          address: '0x8e4C131B37383E431B9cd0635D3cF9f3F628EDae',
          creationBlockNumber: 0,
        },
        mainnet: {
          address: '0xa015c141C02996EcE6410646DA3D07d70091c577',
          creationBlockNumber: 14884007,
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
