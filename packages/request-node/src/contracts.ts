import { StorageTypes } from '@requestnetwork/types';
import { ChainContract } from 'viem';

// Copied from packages/smart-contracts/src/lib/artifacts/RequestHashSubmitter/index.ts to reduce bundle s
// FIXME: automate the copy, or add dependency to smart-contracts and rely on tree-shaking
export const hashSubmitterContracts: Record<number, ChainContract> = {
  [StorageTypes.EthereumNetwork.PRIVATE]: {
    address: '0xf25186b5081ff5ce73482ad761db0eb0d25abfbf',
    blockCreated: 1,
  },
  [StorageTypes.EthereumNetwork.MAINNET]: {
    address: '0xa9cEaA10c12dcB33BAbC2D779e37732311504652',
    blockCreated: 8225341,
  },
  [StorageTypes.EthereumNetwork.RINKEBY]: {
    address: '0xf4eacf30944a1a029b567a9ed29db8d120452c2c',
    blockCreated: 4742922,
  },
  [StorageTypes.EthereumNetwork.GOERLI]: {
    address: '0x2C96132bae414000E267E6A8d4BfFd8bfaa21309',
    blockCreated: 7145146,
  },
  [StorageTypes.EthereumNetwork.XDAI]: {
    address: '0x268C146Afb4790902Ee26A6D2d3aff968623Ec80',
    blockCreated: 15193804,
  },
};
