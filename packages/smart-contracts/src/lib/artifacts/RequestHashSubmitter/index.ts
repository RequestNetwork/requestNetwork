import { ContractArtifact } from '../../ContractArtifact';

import { abi as ABI_0_1_0 } from './0.1.0.json';
// @ts-ignore Cannot find module
import type { RequestOpenHashSubmitter } from '../../../types/RequestOpenHashSubmitter';

export const requestHashSubmitterArtifact = new ContractArtifact<RequestOpenHashSubmitter>(
  {
    '0.1.0': {
      abi: ABI_0_1_0,
      deployment: {
        private: {
          address: '0xf25186b5081ff5ce73482ad761db0eb0d25abfbf',
          creationBlockNumber: 1,
        },
        mainnet: {
          address: '0xa9cEaA10c12dcB33BAbC2D779e37732311504652',
          creationBlockNumber: 8225341,
        },
        rinkeby: {
          address: '0xf4eacf30944a1a029b567a9ed29db8d120452c2c',
          creationBlockNumber: 4742922,
        },
        goerli: {
          address: '0x2C96132bae414000E267E6A8d4BfFd8bfaa21309',
          creationBlockNumber: 7145146,
        },
        xdai: {
          address: '0x268C146Afb4790902Ee26A6D2d3aff968623Ec80',
          creationBlockNumber: 15193804,
        },
      },
    },
  },
  '0.1.0',
);
