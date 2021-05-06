import { ContractArtifact } from '../../ContractArtifact';

import { abi as ABI_0_1_0 } from '../ERC20FeeProxy/0.1.0.json';
import type { ERC20FeeProxy } from '../../../../types/ERC20FeeProxy';

export const erc20FeeProxyArtifact = new ContractArtifact<ERC20FeeProxy>(
  {
    '0.1.0': {
      abi: ABI_0_1_0,
      deployment: {
        mainnet: {
          address: '0x2171a0dc12a9E5b1659feF2BB20E54c84Fa7dB0C',
          creationBlockNumber: 14163521,
        },
        mumbai: {
          address: '0x131eb294E3803F23dc2882AB795631A12D1d8929',
          creationBlockNumber: 14163521,
        },
      },
    },
  },
  '0.1.0',
);
