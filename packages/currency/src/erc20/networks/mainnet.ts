import { RequestLogicTypes } from '@requestnetwork/types';

import * as metamaskContractMap from '@metamask/contract-metadata';

// These interfaces are declared here because they should be used only in this context
// A Token description from the eth-contract-metadata list
interface ITokenDescription {
  name: string;
  logo?: string;
  erc20: boolean;
  symbol: string;
  decimals: number;
  address: string;
}

// The map containing all the ITokenDescription objects
interface ITokenMap {
  [address: string]: ITokenDescription;
}

export const extraERC20Tokens = {
  // INDA
  '0x433d86336dB759855A66cCAbe4338313a8A7fc77': {
    name: 'Indacoin',
    erc20: true,
    logo: 'inda.svg',
    symbol: 'INDA',
    decimals: 2,
  },
  // MPH
  '0x8888801aF4d980682e47f1A9036e589479e835C5': {
    name: '88mph.app',
    erc20: true,
    logo: 'mph.svg',
    symbol: 'MPH',
    decimals: 18,
  },
  // OCEAN
  '0x967da4048cD07aB37855c090aAF366e4ce1b9F48': {
    name: 'Ocean Token',
    erc20: true,
    symbol: 'OCEAN',
    decimals: 18,
  },
  // SAND (Sandbox Game)
  '0x3845badAde8e6dFF049820680d1F14bD3903a5d0': {
    name: 'SAND',
    erc20: true,
    symbol: 'SAND',
    decimals: 18,
  },
  // ANKR
  '0x8290333ceF9e6D528dD5618Fb97a76f268f3EDD4': {
    name: 'Ankr Network',
    erc20: true,
    symbol: 'ANKR',
    decimals: 18,
  },
  // XSGD
  '0x70e8dE73cE538DA2bEEd35d14187F6959a8ecA96': {
    name: 'XSGD',
    erc20: true,
    symbol: 'XSGD',
    decimals: 6,
  },
  // OLY
  '0x6595b8fD9C920C81500dCa94e53Cdc712513Fb1f': {
    name: 'Olyseum',
    erc20: true,
    symbol: 'OLY',
    decimals: 18,
  },
};

// Merge metamask contracts list with our own
const supportedERC20Tokens: ITokenMap = {
  ...metamaskContractMap,
  ...extraERC20Tokens,
};

// List of the supported mainnet ERC20 tokens
export const supportedMainnetERC20 = new Map(
  Object.entries(supportedERC20Tokens)
    .filter(([, tokenObject]) => tokenObject.erc20)
    .map(([address, tokenObject]) => {
      return [
        tokenObject.symbol,
        {
          network: 'mainnet',
          type: RequestLogicTypes.CURRENCY.ERC20,
          value: address,
        },
      ];
    }),
);

// Additional details about the supported mainnet ERC20 tokens.
export const supportedMainnetERC20Details = Object.entries(supportedERC20Tokens).reduce(
  (acc: any, entry: any[]) => {
    const address = entry[0];
    const value = entry[1];

    if (value.erc20) {
      acc[value.symbol] = {
        name: value.name,
        decimals: value.decimals,
        symbol: value.symbol,
        address,
      };
    }
    return acc;
  },
  {},
);
