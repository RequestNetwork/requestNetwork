import { ContractArtifact } from '../../ContractArtifact';

import { abi as ABI_0_1_0 } from './0.1.0.json';
// @ts-ignore Cannot find module
import type { ChainlinkConversionPath } from '../../../types/ChainlinkConversionPath';

export const chainlinkConversionPath = new ContractArtifact<ChainlinkConversionPath>(
  {
    '0.1.0': {
      abi: ABI_0_1_0,
      deployment: {
        private: {
          address: '0x4e71920b7330515faf5EA0c690f1aD06a85fB60c',
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
        matic: {
          address: '0xEEc4790306C43DC00cebbE4D0c36Fadf8634B533',
          creationBlockNumber: 17427745,
        },
        xdai: {
          address: '0xEEc4790306C43DC00cebbE4D0c36Fadf8634B533',
          creationBlockNumber: 18326897,
        },
        bsctest: {
          address: '0xEEc4790306C43DC00cebbE4D0c36Fadf8634B533',
          creationBlockNumber: 12759694,
        },
        bsc: {
          address: '0xEEc4790306C43DC00cebbE4D0c36Fadf8634B533',
          creationBlockNumber: 11540176,
        },
        fantom: {
          address: '0xEEc4790306C43DC00cebbE4D0c36Fadf8634B533',
          creationBlockNumber: 20061324,
        },
        celo: {
          address: '0xEEc4790306C43DC00cebbE4D0c36Fadf8634B533',
          creationBlockNumber: 10141032,
        },
      },
    },
  },
  '0.1.0',
);
