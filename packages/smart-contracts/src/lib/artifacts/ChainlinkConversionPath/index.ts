import { ContractArtifact } from '../../ContractArtifact';

import { abi as ABI_0_1_0 } from './0.1.0.json';
import type { ChainlinkConversionPath } from '../../../types/ChainlinkConversionPath';

export const chainlinkConversionPath = new ContractArtifact<ChainlinkConversionPath>(
  {
    '0.1.0': {
      abi: ABI_0_1_0,
      deployment: {
        private: {
          address: '0xF328c11c4dF88d18FcBd30ad38d8B4714F4b33bF',
          creationBlockNumber: 0,
        },
        mainnet: {
          address: '0xC5519f3fcECC8EC85caaF8836563dEe9a00080f9',
          creationBlockNumber: 12225729,
        },
        rinkeby: {
          address: '0xBFAD7f00A3988BFf17144728b624267Fee7F236e',
          creationBlockNumber: 7684572,
        },
      },
    },
  },
  '0.1.0',
);
