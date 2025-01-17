import { ContractArtifact } from '../../ContractArtifact';

import { abi as ABI_0_1_0 } from './0.1.0.json';

/**
 * Doesn't store the Safe interface.
 * Only used to maintain the list of RN Safe administrating the contracts across supported chains
 */
export const safeAdminArtifact = new ContractArtifact<any>(
  {
    '0.1.0': {
      abi: ABI_0_1_0,
      deployment: {
        mainnet: {
          address: '0xBB428798fD43431b224aF319013A8740B47f962b',
          creationBlockNumber: 1,
        },
        matic: {
          address: '0x8d188533F7eD39fe355458A5d4766A9cE9C8071B',
          creationBlockNumber: 1,
        },
        xdai: {
          address: '0x8a4D2659f6d24312804BFA2f1F174A5498948037',
          creationBlockNumber: 1,
        },
        bsc: {
          address: '0x67817a094599cD73D64495509F1c3C24d0f2C4DB',
          creationBlockNumber: 1,
        },
        'arbitrum-one': {
          address: '0xC806e694FDB31Ce879B08c29b3Ba4127122A3524',
          creationBlockNumber: 1,
        },
        optimism: {
          address: '0xDF593767a0b42C641845e026F898f9C465d1E714',
          creationBlockNumber: 1,
        },
        zksyncera: {
          address: '0xC93edf2722d17d423bCd630CBB9384Cd629890f3',
          creationBlockNumber: 1,
        },
        celo: {
          address: '0x7eF1DC5317Dd6Fd258766A1B620930c2DD8A54A8',
          creationBlockNumber: 1,
        },
        avalanche: {
          address: '0xAb05E8277c2c605D2762F6e3B6175Cab954fC8e8',
          creationBlockNumber: 1,
        },
        base: {
          address: '0xf735afF55745e00D85F30AFB01E1c042D0755628',
          creationBlockNumber: 1,
        },
      },
    },
  },
  '0.1.0',
);
