import { ContractArtifact } from '../../ContractArtifact';

import { abi as ABI_0_1_0 } from './0.1.0.json';
// @ts-ignore Cannot find module
import type { BatchConversionPayments } from '../../../types';

export const batchConversionPaymentsArtifact = new ContractArtifact<BatchConversionPayments>(
  {
    '0.1.0': {
      abi: ABI_0_1_0,
      deployment: {
        private: {
          address: '0x2e335F247E91caa168c64b63104C4475b2af3942',
          creationBlockNumber: 0,
        },
        goerli: {
          address: '0x3cF63891928B8CeebB81C95426600a18cd59C03f',
          creationBlockNumber: 7838405,
        },
        mainnet: {
          address: '0x3cF63891928B8CeebB81C95426600a18cd59C03f',
          creationBlockNumber: 15832733,
        },
        matic: {
          address: '0x3cF63891928B8CeebB81C95426600a18cd59C03f',
          creationBlockNumber: 34825335,
        },
        bsc: {
          address: '0x3cF63891928B8CeebB81C95426600a18cd59C03f',
          creationBlockNumber: 22511974,
        },
        celo: {
          address: '0x3cF63891928B8CeebB81C95426600a18cd59C03f',
          creationBlockNumber: 15825019,
        },
        'arbitrum-one': {
          address: '0x3cF63891928B8CeebB81C95426600a18cd59C03f',
          creationBlockNumber: 32766338,
        },
        fantom: {
          address: '0x3cF63891928B8CeebB81C95426600a18cd59C03f',
          creationBlockNumber: 50036523,
        },
        avalanche: {
          address: '0x3cF63891928B8CeebB81C95426600a18cd59C03f',
          creationBlockNumber: 21564537,
        },
        optimism: {
          address: '0x3cF63891928B8CeebB81C95426600a18cd59C03f',
          creationBlockNumber: 44224282,
        },
        moonbeam: {
          address: '0x3cF63891928B8CeebB81C95426600a18cd59C03f',
          creationBlockNumber: 2415525,
        },
        // Caution: no ETHConversion proxy on xDai
        xdai: {
          address: '0x3cF63891928B8CeebB81C95426600a18cd59C03f',
          creationBlockNumber: 24744781,
        },
        // Caution: no ETHConversion, ERC20Conversion, and chainlinkConversionPath proxies on fuse
        fuse: {
          address: '0x3cF63891928B8CeebB81C95426600a18cd59C03f',
          creationBlockNumber: 19856206,
        },
        // Caution: no ETHConversion, ERC20Conversion, and chainlinkConversionPath proxies on zkSyncEra
        zksyncera: {
          address: '0x0C41700ee1B363DB2ebC1a985f65cAf6eC4b1023',
          creationBlockNumber: 19545614,
        },
        zksynceratestnet: {
          address: '0x9959F193498e75A2a46A04647fC15a031e308a0b',
          creationBlockNumber: 13769945,
        },
      },
    },
  },
  '0.1.0',
);
