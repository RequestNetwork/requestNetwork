import { CurrencyTypes, RequestLogicTypes } from '@requestnetwork/types';

/**
 * Checks if a Near address is valid according to a currency network.
 * Returns true if the currency network is not given and the address is correct for any network.
 */
export const isValidNearAddress = (address: string, network?: string): boolean => {
  if (!network) {
    return isValidNearAddress(address, 'near') || isValidNearAddress(address, 'near-testnet');
  }
  // see link bellow for NEAR address specification
  // https://nomicon.io/DataStructures/Account.html
  if (address.length < 2 || address.length > 64) {
    return false;
  }
  if (!address.match(/^(([a-z\d]+[-_])*[a-z\d]+\.)*([a-z\d]+[-_])*[a-z\d]+$/)) {
    return false;
  }

  // Return true when account format is in hexadecimal format
  if (address.match(/[a-fA-F0-9]{64}$/)) {
    return true;
  }

  // see link bellow for details about top level accounts on mainnet and testnet
  // https://docs.near.org/docs/videos/accounts-keys
  switch (network) {
    case 'aurora':
    case 'near':
      return !!address.match(/\.near$/);
    case 'aurora-testnet':
    case 'near-testnet':
      return !!address.match(/\.testnet$/);
    default:
      throw new Error(`Cannot validate NEAR address for network ${network}`);
  }
};

/**
 * Type guards
 * Enable filtering per currency type
 */

export const isNativeCurrency = (
  currency: CurrencyTypes.CurrencyInput,
): currency is CurrencyTypes.NativeCurrencyInput => {
  return (
    currency.type === RequestLogicTypes.CURRENCY.BTC ||
    currency.type === RequestLogicTypes.CURRENCY.ETH
  );
};

export const isISO4217Currency = (
  currency: CurrencyTypes.CurrencyInput,
): currency is CurrencyTypes.ISO4217CurrencyInput => {
  return currency.type === RequestLogicTypes.CURRENCY.ISO4217;
};

export const isERC20Currency = (
  currency: CurrencyTypes.CurrencyInput,
): currency is CurrencyTypes.ERC20CurrencyInput => {
  return currency.type === RequestLogicTypes.CURRENCY.ERC20;
};

export const isERC777Currency = (
  currency: CurrencyTypes.CurrencyInput,
): currency is CurrencyTypes.ERC777CurrencyInput => {
  return currency.type === RequestLogicTypes.CURRENCY.ERC777;
};
