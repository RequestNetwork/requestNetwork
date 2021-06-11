import { ContractArtifact } from '../../ContractArtifact';

import { abi as ABI_0_1_0 } from './0.1.0.json';
import type { ERC20FeeProxy } from '../../../types/ERC20FeeProxy';

export const erc20FeeProxyArtifact = new ContractArtifact<ERC20FeeProxy>(
  {
    '0.1.0': {
      abi: ABI_0_1_0,
      deployment: {
        private: {
          address: '0x75c35C980C0d37ef46DF04d31A140b65503c0eEd',
          creationBlockNumber: 0,
        },
        mainnet: {
          address: '0x370DE27fdb7D1Ff1e1BaA7D11c5820a324Cf623C',
          creationBlockNumber: 10774767,
        },
        rinkeby: {
          address: '0xda46309973bFfDdD5a10cE12c44d2EE266f45A44',
          creationBlockNumber: 7118080,
        },
        matic: {
          address: '0x2171a0dc12a9E5b1659feF2BB20E54c84Fa7dB0C',
          creationBlockNumber: 14163521,
        },
        mumbai: {
          address: '0x131eb294E3803F23dc2882AB795631A12D1d8929',
          creationBlockNumber: 13127007,
        },
        celo: {
          address: '0x2171a0dc12a9E5b1659feF2BB20E54c84Fa7dB0C',
          creationBlockNumber: 7169237,
        },
        alfajores: {
          address: '0x612cF8a29A9c8965a5fE512b7463165861c07EAa',
          creationBlockNumber: 5216414,
        },
        // Temporary address used to test
        fuse: {
          address: '0xee07ef5B414955188d2A9fF50bdCE784A49031Fc',
          creationBlockNumber: 11068489,
        },
      },
    },
  },
  '0.1.0',
);
