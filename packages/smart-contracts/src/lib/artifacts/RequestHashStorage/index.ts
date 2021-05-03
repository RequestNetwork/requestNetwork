import { ContractArtifact } from '../../ContractArtifact';

import { abi as ABI_0_1_0 } from './0.1.0.json';
import type { RequestHashStorage } from '../../../types/RequestHashStorage';

export const requestHashStorageArtifact = new ContractArtifact<RequestHashStorage>(
  {
    '0.1.0': {
      abi: ABI_0_1_0,
      deployment: {
        private: {
          address: '0x345ca3e014aaf5dca488057592ee47305d9b3e10',
          creationBlockNumber: 0,
        },
        mainnet: {
          address: '0x24a66afda3666fb0202f439708ece45c8121a9bb',
          creationBlockNumber: 8225149,
        },
        rinkeby: {
          address: '0x309a3a9898f9cafc26499243a980992156671e5e',
          creationBlockNumber: 4742809,
        },
        xdai: {
          address: '0x2256938E8225a998C498bf86B43c1768EE14b90B',
          creationBlockNumber: 15193752,
        },
      },
    },
  },
  '0.1.0',
);
