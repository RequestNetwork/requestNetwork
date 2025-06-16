import { ContractArtifact } from '../../ContractArtifact';

import { abi as ABI_0_1_0 } from './0.1.0.json';

import type { ERC20RecurringPaymentProxy } from '../../../types';

export const erc20RecurringPaymentProxyArtifact = new ContractArtifact<ERC20RecurringPaymentProxy>(
  {
    '0.1.0': {
      abi: ABI_0_1_0,
      deployment: {
        private: {
          address: '0xd8672a4A1bf37D36beF74E36edb4f17845E76F4e',
          creationBlockNumber: 0,
        },
      },
    },
  },
  '0.1.0',
);
