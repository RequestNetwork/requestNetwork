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
          address: '0x7DfD5955a1Ed6Bf74ccF8e24FF53E0a9A7e9F477',
          creationBlockNumber: 15146972,
        },
        rinkeby: {
          address: '0x2b487A3251aCC34ae95E4f5aA7fdcD2C7447B42e',
          creationBlockNumber: 11028247,
        },
        goerli: {
          address: '0xd2777001fD7D89331D8E87eC439f78079179322b',
          creationBlockNumber: 7230322,
        },
        goerli: {
          address: '0xd2777001fD7D89331D8E87eC439f78079179322b',
          creationBlockNumber: 7230322,
        },
        matic: {
          address: '0x937Db37ffb67083242fbC6AdD472146bF10E01ec',
          creationBlockNumber: 30751595,
        },
        fuse: {
          address: '0x4BA012eae4d64da79Bd6bcdBa366803fCe701A4C',
          creationBlockNumber: 18086337,
        },
      },
    },
  },
  '0.1.0',
);
