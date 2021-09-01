import { ContractArtifact } from '../../ContractArtifact';

import { abi as ABI_0_1_0 } from './0.1.0.json';
import type { TestERC20FeeProxy } from '../../../types/TestERC20FeeProxy';

export const testerc20FeeProxyArtifact = new ContractArtifact<TestERC20FeeProxy>(
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
      },
    },
    '0.2.0': {
      abi: ABI_0_1_0,
      deployment: {
        private: {
          address: '0x8273e4B8ED6c78e252a9fCa5563Adfcc75C91b2A',
          creationBlockNumber: 0,
        },
        mainnet: {
          address: 'TODO',
          creationBlockNumber: 10774767,
        },
        rinkeby: {
          address: 'TODO',
          creationBlockNumber: 7118080,
        },
      },
    },
  },
  '0.2.0',
);
