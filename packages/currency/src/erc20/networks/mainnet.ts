import { RequestLogicTypes } from '@requestnetwork/types';
import { utils } from 'ethers';

const metamaskContractMap = require('@metamask/contract-metadata');

// These interfaces are declared here because they should be used only in this context
// A Token description from the eth-contract-metadata list
interface ITokenDescription {
  name: string;
  logo: string;
  erc20: boolean;
  symbol: string;
  decimals: number;
  address: string;
}

// The map containing all the ITokenDescription objects
interface ITokenMap {
  [address: string]: ITokenDescription;
}

/* eslint-disable spellcheck/spell-checker */
const extraERC20Tokens = {
  // INDA
  '0x433d86336dB759855A66cCAbe4338313a8A7fc77': {
    name: 'Indacoin',
    erc20: true,
    logo: 'inda.svg',
    symbol: 'INDA',
    decimals: 2,
    address: '0x433d86336dB759855A66cCAbe4338313a8A7fc77',
  },
};
/* eslint-enable spellcheck/spell-checker */

// // Merge metamask contracts list with our own
const supportedERC20Tokens: ITokenMap = {
  ...metamaskContractMap,
  ...extraERC20Tokens,
};

// List of the supported mainnet ERC20 tokens
export const supportedMainnetERC20 = new Map(
  Object.entries(supportedERC20Tokens)
    .filter(([_, tokenObject]) => tokenObject.erc20)
    .map(([address, tokenObject]) => {
      return [
        tokenObject.symbol,
        {
          network: 'mainnet',
          type: RequestLogicTypes.CURRENCY.ERC20,
          value: utils.getAddress(address),
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
        address: utils.getAddress(address),
      };
    }
    return acc;
  },
  {},
);
