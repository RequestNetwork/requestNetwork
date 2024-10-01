import { ContractArtifact } from '../../ContractArtifact';

import { abi as ABI_0_1_0 } from './0.1.0.json';
import { abi as ABI_0_2_0 } from './0.2.0.json';
import { abi as ABI_0_2_1 } from './0.2.1.json';
// @ts-ignore Cannot find module
import type { ChainlinkConversionPath } from '../../../types';

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
        goerli: {
          address: '0x70bE16E6B7F465bED2237Cf609341A29C019B3bf',
          creationBlockNumber: 7108894,
        },
        // v0.1.0 Used by Erc20Conversion / Erc20SwapConversion
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
        // v0.1.0 Used by Erc20Conversion / Erc20SwapConversion
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
      },
    },
    '0.2.0': {
      abi: ABI_0_2_0,
      deployment: {
        private: {
          address: '0x4e71920b7330515faf5EA0c690f1aD06a85fB60c',
          creationBlockNumber: 0,
        },
        rinkeby: {
          address: '0x0818Ad7016138f0A40DFAe30F64a923c2A8F61bA',
          creationBlockNumber: 10023414,
        },
        goerli: {
          address: '0x70bE16E6B7F465bED2237Cf609341A29C019B3bf',
          creationBlockNumber: 7108894,
        },
        // v0.1.0 contract - v0.2.0 is not required for mainnet
        mainnet: {
          address: '0xC5519f3fcECC8EC85caaF8836563dEe9a00080f9',
          creationBlockNumber: 12225729,
        },
        // v0.2.0 used by Batch / EthConversion
        matic: {
          address: '0x0818Ad7016138f0A40DFAe30F64a923c2A8F61bA',
          creationBlockNumber: 25999509,
        },
        // v0.2.0 used by Batch / EthConversion
        fantom: {
          address: '0x0818Ad7016138f0A40DFAe30F64a923c2A8F61bA',
          creationBlockNumber: 28548259,
        },
        xdai: {
          address: '0x05D782aD6D6556179A6387Ff1D2fA104FD5c515a',
          creationBlockNumber: 35928984,
        },
        'arbitrum-one': {
          address: '0x0818Ad7016138f0A40DFAe30F64a923c2A8F61bA',
          creationBlockNumber: 5317970,
        },
        avalanche: {
          address: '0x0818Ad7016138f0A40DFAe30F64a923c2A8F61bA',
          creationBlockNumber: 11671698,
        },
        celo: {
          address: '0x0818Ad7016138f0A40DFAe30F64a923c2A8F61bA',
          creationBlockNumber: 11969004,
        },
        bsc: {
          address: '0x0818Ad7016138f0A40DFAe30F64a923c2A8F61bA',
          creationBlockNumber: 16170262,
        },
        optimism: {
          address: '0x0818Ad7016138f0A40DFAe30F64a923c2A8F61bA',
          creationBlockNumber: 35490284,
        },
        moonbeam: {
          address: '0x0818Ad7016138f0A40DFAe30F64a923c2A8F61bA',
          creationBlockNumber: 2415429,
        },
        /**
         * The contract was deployed on networks below with ABI 0.2.1
         * The ABI for payments is the same, only administration tasks change.
         */
        sepolia: {
          address: '0x7c285b9F2dA5E2c10feA25C00Ce1aCB107F85475',
          creationBlockNumber: 4733359,
        },
        base: {
          address: '0x3dF89c727eaDF67eeD7b4d09EC4F2b41f8Dec2ca',
          creationBlockNumber: 10827258,
        },
      },
    },
    '0.2.1': {
      abi: ABI_0_2_1,
      deployment: {
        sepolia: {
          address: '0x7c285b9F2dA5E2c10feA25C00Ce1aCB107F85475',
          creationBlockNumber: 4733359,
        },
        base: {
          address: '0x3dF89c727eaDF67eeD7b4d09EC4F2b41f8Dec2ca',
          creationBlockNumber: 10827258,
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
  // Not used, 0.1.0 is only bugged for other networks
  /*
   '0.2.0': {
    mainnet: {
      address: '0x0818Ad7016138f0A40DFAe30F64a923c2A8F61bA',
      creationBlockNumber: 14448210,
    },
  }
  */
  '0.2.0',
);
