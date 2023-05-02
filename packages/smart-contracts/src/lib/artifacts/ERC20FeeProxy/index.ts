import { ContractArtifact } from '../../ContractArtifact';

import { abi as ABI_0_1_0 } from './0.1.0.json';
// @ts-ignore Cannot find module
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
        goerli: {
          address: '0x399F5EE127ce7432E4921a61b8CF52b0af52cbfE',
          creationBlockNumber: 7091472,
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
        xdai: {
          address: '0x0DfbEe143b42B41eFC5A6F87bFD1fFC78c2f0aC9',
          creationBlockNumber: 18326896,
        },
      },
    },
    '0.2.0': {
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
        goerli: {
          address: '0x399F5EE127ce7432E4921a61b8CF52b0af52cbfE',
          creationBlockNumber: 7091472,
        },
        matic: {
          address: '0x0DfbEe143b42B41eFC5A6F87bFD1fFC78c2f0aC9',
          creationBlockNumber: 17427742,
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
        fuse: {
          address: '0xee07ef5B414955188d2A9fF50bdCE784A49031Fc',
          creationBlockNumber: 15306858,
        },
        xdai: {
          address: '0x0DfbEe143b42B41eFC5A6F87bFD1fFC78c2f0aC9',
          creationBlockNumber: 18326896,
        },
        bsctest: {
          address: '0x0DfbEe143b42B41eFC5A6F87bFD1fFC78c2f0aC9',
          creationBlockNumber: 12759691,
        },
        bsc: {
          address: '0x0DfbEe143b42B41eFC5A6F87bFD1fFC78c2f0aC9',
          creationBlockNumber: 11540173,
        },
        fantom: {
          address: '0x0DfbEe143b42B41eFC5A6F87bFD1fFC78c2f0aC9',
          creationBlockNumber: 20060722,
        },
        'arbitrum-rinkeby': {
          address: '0x0DfbEe143b42B41eFC5A6F87bFD1fFC78c2f0aC9',
          creationBlockNumber: 8403921,
        },
        'arbitrum-one': {
          address: '0x0DfbEe143b42B41eFC5A6F87bFD1fFC78c2f0aC9',
          creationBlockNumber: 5309741,
        },
        avalanche: {
          address: '0x0DfbEe143b42B41eFC5A6F87bFD1fFC78c2f0aC9',
          creationBlockNumber: 11671431,
        },
        ronin: {
          address: '0xAe23992483FeDA6E718a808Ce824f6864F13B64B',
          creationBlockNumber: 17901276,
        },
        optimism: {
          address: '0x399F5EE127ce7432E4921a61b8CF52b0af52cbfE',
          creationBlockNumber: 34638633,
        },
        moonbeam: {
          address: '0x399F5EE127ce7432E4921a61b8CF52b0af52cbfE',
          creationBlockNumber: 2415492,
        },
        tombchain: {
          address: '0x399F5EE127ce7432E4921a61b8CF52b0af52cbfE',
          creationBlockNumber: 2951048,
        },
      },
    },
    near: {
      abi: [],
      deployment: {
        'aurora-testnet': {
          address: 'pay.reqnetwork.testnet',
          creationBlockNumber: 120566834,
        },
        aurora: {
          address: 'pay.reqnetwork.near',
          creationBlockNumber: 89421541,
        },
      },
    },
    // Additional deployments of same versions, not worth upgrading the version number but worth using within next versions
    /*
    '0.2.0-next': {
      abi: ABI_0_1_0,
      deployment: {
        mainnet: {
          address: '0x0DfbEe143b42B41eFC5A6F87bFD1fFC78c2f0aC9',
          creationBlockNumber: 13764025,
        },
        rinkeby: {
          address: '0x0DfbEe143b42B41eFC5A6F87bFD1fFC78c2f0aC9',
          creationBlockNumber: 	9447187,
        },
        celo: {
          address: '0x0DfbEe143b42B41eFC5A6F87bFD1fFC78c2f0aC9',
          creationBlockNumber: 10141030,
        },
      },
    },
    */
  },
  '0.2.0',
);
