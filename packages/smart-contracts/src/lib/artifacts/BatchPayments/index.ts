import { ContractArtifact } from '../../ContractArtifact';

import { abi as ABI_0_1_0 } from './0.1.0.json';
// @ts-ignore Cannot find module
import type { BatchPayments } from '../../../types';

export const batchPaymentsArtifact = new ContractArtifact<BatchPayments>(
  {
    '0.1.0': {
      abi: ABI_0_1_0,
      deployment: {
        private: {
          address: '0x1411CB266FCEd1587b0AA29E9d5a9Ef3Db64A9C5',
          creationBlockNumber: 0,
        },
        rinkeby: {
          address: '0x0DD57FFe83a53bCbd657e234B16A3e74fEDb8fBA',
          creationBlockNumber: 10857190,
        },
        goerli: {
          address: '0x0DD57FFe83a53bCbd657e234B16A3e74fEDb8fBA',
          creationBlockNumber: 7091488,
        },
        mainnet: {
          address: '0x0DD57FFe83a53bCbd657e234B16A3e74fEDb8fBA',
          creationBlockNumber: 14884721,
        },
        matic: {
          address: '0x0DD57FFe83a53bCbd657e234B16A3e74fEDb8fBA',
          creationBlockNumber: 29028253,
        },
        celo: {
          address: '0x0DD57FFe83a53bCbd657e234B16A3e74fEDb8fBA',
          creationBlockNumber: 13301318,
        },
        fuse: {
          address: '0x0DD57FFe83a53bCbd657e234B16A3e74fEDb8fBA',
          creationBlockNumber: 17329966,
        },
        xdai: {
          address: '0x0DD57FFe83a53bCbd657e234B16A3e74fEDb8fBA',
          creationBlockNumber: 22438505,
        },
        bsc: {
          address: '0x0DD57FFe83a53bCbd657e234B16A3e74fEDb8fBA',
          creationBlockNumber: 18772049,
        },
        fantom: {
          address: '0x0DD57FFe83a53bCbd657e234B16A3e74fEDb8fBA',
          creationBlockNumber: 39541135,
        },
        'arbitrum-one': {
          address: '0x0DD57FFe83a53bCbd657e234B16A3e74fEDb8fBA',
          creationBlockNumber: 13425347,
        },
        avalanche: {
          address: '0x0DD57FFe83a53bCbd657e234B16A3e74fEDb8fBA',
          creationBlockNumber: 16157128,
        },
        optimism: {
          address: '0x0DD57FFe83a53bCbd657e234B16A3e74fEDb8fBA',
          creationBlockNumber: 35498688,
        },
      },
    },
  },
  '0.1.0',
);
