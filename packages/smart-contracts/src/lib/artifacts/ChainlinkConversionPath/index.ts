import { ContractArtifact } from '../../ContractArtifact';

import { abi as ABI_0_1_0 } from './0.1.0.json';
import { abi as ABI_0_2_0 } from './0.2.0.json';
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
        // FIXME: add goerli version
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
        'arbitrum-rinkeby': {
          address: '0xEEc4790306C43DC00cebbE4D0c36Fadf8634B533',
          creationBlockNumber: 8403926,
        },
        // FIXME: add goerli version
      },
    },
    '0.2.0': {
      abi: ABI_0_2_0,
      deployment: {
        private: {
          address: '0x4e71920b7330515faf5EA0c690f1aD06a85fB60c',
          creationBlockNumber: 0,
        },
        // Not used, 0.1.0 is only bugged for other networks
        mainnet: {
          address: '0x0818Ad7016138f0A40DFAe30F64a923c2A8F61bA',
          creationBlockNumber: 14448210,
        },
        rinkeby: {
          address: '0x0818Ad7016138f0A40DFAe30F64a923c2A8F61bA',
          creationBlockNumber: 10023414,
        },
        // FIXME: add goerli version
        fantom: {
          address: '0x0818Ad7016138f0A40DFAe30F64a923c2A8F61bA',
          creationBlockNumber: 28548259,
        },
        'arbitrum-one': {
          address: '0x0818Ad7016138f0A40DFAe30F64a923c2A8F61bA',
          creationBlockNumber: 5317970,
        },
        avalanche: {
          address: '0x0818Ad7016138f0A40DFAe30F64a923c2A8F61bA',
          creationBlockNumber: 11671698,
        },
        matic: {
          address: '0x0818Ad7016138f0A40DFAe30F64a923c2A8F61bA',
          creationBlockNumber: 25999509,
        },
        celo: {
          address: '0x0818Ad7016138f0A40DFAe30F64a923c2A8F61bA',
          creationBlockNumber: 11969004,
        },
        bsc: {
          address: '0x0818Ad7016138f0A40DFAe30F64a923c2A8F61bA',
          creationBlockNumber: 16170262,
        },
      },
    },
  },
  // Additional deployments of same versions, not worth upgrading the version number but worth using within next versions
  /*
  '0.1.0-next': {
    abi: ABI_0_1_0,
    deployment: {
      mainnet: {
        address: '0xEEc4790306C43DC00cebbE4D0c36Fadf8634B533',
        creationBlockNumber: 13764027,
      },
    },
  },
  */
  '0.2.0',
);
