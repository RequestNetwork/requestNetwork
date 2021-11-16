import { ContractArtifact } from '../../ContractArtifact';

import { abi as ABI_0_1_0 } from './0.1.0.json';
// @ts-ignore Cannot find module
import type { ERC20EscrowToPay } from '../../../types/ERC2EscrowToPay';

export const erc20EscrowToPayArtifact = new ContractArtifact<ERC20EscrowToPay>(
    {
    '0.1.0': {
        abi: ABI_0_1_0,
        deployment: {
            private: {
                address: '0xF08dF3eFDD854FEDE77Ed3b2E515090EEe765154',
                creationBlockNumber: 0,
            },
            mainnet: {
                address: '',
                creationBlockNumber: 0,
            },
            rinkeby: {
                address: '0xC34C8a06D1ffC645b01cda45886A46a5b188ba29',
                creationBlockNumber: 0,
            },
        },
    },
    },
    '0.1.0',
);