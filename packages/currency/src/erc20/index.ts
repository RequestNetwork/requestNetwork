import { RequestLogicTypes } from '@requestnetwork/types';
import { ethers } from 'ethers';
import { supportedNetworks } from './networks';

const getTokenInfoFromSymbol = (symbol: string, network?: string) => {
  for (const networkKey of Object.keys(supportedNetworks).filter(
    (net) => !network || net === network,
  )) {
    const token = Object.entries(supportedNetworks[networkKey]).find(
      ([, info]) => info.symbol === symbol,
    );
    if (token) {
      return {
        address: token[0],
        network: networkKey,
        ...token[1],
      };
    }
  }
  return null;
};

const getTokenInfoFromCurrency = (currency: RequestLogicTypes.ICurrency) => {
  const network = currency.network || 'mainnet';
  const address = ethers.utils.getAddress(currency.value.toLowerCase());
  return supportedNetworks[network]?.[address];
};

/**
 * Returns a Currency object for an ERC20, if found
 * @param symbol The ERC20 token symbol
 * @param network The ERC20 contract network
 */
export function getErc20Currency(
  symbol: string,
  network?: string,
): RequestLogicTypes.ICurrency | undefined {
  const info = getTokenInfoFromSymbol(symbol, network);
  if (info) {
    return {
      type: RequestLogicTypes.CURRENCY.ERC20,
      value: info.address,
      network: info.network,
    };
  }
}

/**
 * Get the amount of decimals for an ERC20 currency
 *
 * @param currency The ERC20 Currency object
 * @returns The number of decimals for the ERC20 currency
 */
export function getErc20Decimals(currency: RequestLogicTypes.ICurrency): number {
  const erc20Token = getTokenInfoFromCurrency(currency);

  if (erc20Token) {
    return erc20Token.decimals;
  }
  // If no supported ERC20 is found, throw error
  throw new Error(`Unsupported ERC20 address: ${currency.value}`);
}

/**
 * Get an ERC20 symbol from the Currency object
 *
 * @param token the ERC20 ICurrency
 * @returns the ERC20 currency symbol string
 */
export function getErc20Symbol(currency: RequestLogicTypes.ICurrency): string | null {
  if (currency.type !== RequestLogicTypes.CURRENCY.ERC20) {
    throw new Error('Can only get symbol for ERC20 currencies');
  }
  const erc20Token = getTokenInfoFromCurrency(currency);
  return erc20Token ? erc20Token.symbol : null;
}

interface ERC20TokenDetails {
  address: string;
  decimals: number;
  name: string;
  symbol: string;
  network: string;
}

/**
 * Returns a list of supported ERC20 tokens
 *
 * @returns List of supported ERC20 tokens
 */
export function getSupportedERC20Tokens(): ERC20TokenDetails[] {
  return Object.entries(supportedNetworks).reduce(
    (acc: ERC20TokenDetails[], [networkName, supportedCurrencies]) => {
      return [
        ...acc,
        ...Object.entries(supportedCurrencies).map(([address, token]) => ({
          address,
          network: networkName,
          decimals: token.decimals,
          name: token.name,
          symbol: `${token.symbol}${networkName !== 'mainnet' ? `-${networkName}` : ''}`,
        })),
      ];
    },
    [],
  );
}

/**
 * Returns a list of supported ERC20 currencies
 *
 * @returns List of supported ERC20 currencies
 */
export function getSupportedERC20Currencies(): RequestLogicTypes.ICurrency[] {
  return Object.entries(supportedNetworks).reduce(
    (acc: RequestLogicTypes.ICurrency[], [networkName, supportedCurrencies]) => {
      return [
        ...acc,
        ...Object.keys(supportedCurrencies).map((address) => ({
          network: networkName,
          value: address,
          type: RequestLogicTypes.CURRENCY.ERC20,
        })),
      ];
    },
    [],
  );
}
