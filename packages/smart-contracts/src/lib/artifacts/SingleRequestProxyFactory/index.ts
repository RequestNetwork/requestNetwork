import { ContractArtifact } from '../../ContractArtifact';

import { abi as ABI_0_1_0 } from './0.1.0.json';

import type { SingleRequestProxyFactory } from '../../../types';

export const singleRequestForwarderFactoryArtifact =
  new ContractArtifact<SingleRequestProxyFactory>(
    {
      '0.1.0': {
        abi: ABI_0_1_0,
        deployment: {
          private: {
            address: '0x9d075ae44D859191C121d7522da0Cc3B104b8837',
            creationBlockNumber: 0,
          },
          sepolia: {
            address: '0xf8cACE7EE4c03Eb4f225434B0709527938D365b4',
            creationBlockNumber: 7038199,
          },
          zksyncera: {
            address: '0x9Fd503e723e5EfcCde3183632b443fFF49E68715',
            creationBlockNumber: 48690095,
          },
          base: {
            address: '0xAdc0001eA67Ab36D5321612c6b500572704fFF20',
            creationBlockNumber: 22154500,
          },
          matic: {
            address: '0x4D417AA04DBb207201a794E5B7381B3cde815281',
            creationBlockNumber: 64048143,
          },
          avalanche: {
            address: '0x4D417AA04DBb207201a794E5B7381B3cde815281',
            creationBlockNumber: 52824404,
          },
          optimism: {
            address: '0xf8cACE7EE4c03Eb4f225434B0709527938D365b4',
            creationBlockNumber: 127750366,
          },
          'arbitrum-one': {
            address: '0x4D417AA04DBb207201a794E5B7381B3cde815281',
            creationBlockNumber: 272440350,
          },
          xdai: {
            address: '0x4D417AA04DBb207201a794E5B7381B3cde815281',
            creationBlockNumber: 36924272,
          },
          bsc: {
            address: '0x4D417AA04DBb207201a794E5B7381B3cde815281',
            creationBlockNumber: 43839939,
          },
          celo: {
            address: '0x8d996a0591a0F9eB65301592C88303e07Ec481db',
            creationBlockNumber: 28685655,
          },
          mantle: {
            address: '0xf8cACE7EE4c03Eb4f225434B0709527938D365b4',
            creationBlockNumber: 71485828,
          },
          mainnet: {
            address: '0xD5933C74414ce80D9d7082cc89FBAdcfF4751fAF',
            creationBlockNumber: 21145968,
          },
        },
      },
    },
    '0.1.0',
  );
