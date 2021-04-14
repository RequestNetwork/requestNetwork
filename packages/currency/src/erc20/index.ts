import { RequestLogicTypes } from '@requestnetwork/types';
import { supportedNetworks, supportedNetworksDetails, ERC20SymbolDetails } from './networks';

/**
 * Returns a Currency object for an ERC20, if found
 * @param symbol The ERC20 token symbol
 * @param network The ERC20 contract network
 */
export function getErc20Currency(
  symbol: string,
  network?: string,
): RequestLogicTypes.ICurrency | undefined {
  // Check if it's on one of the other supported networks
  if (network && network in supportedNetworks && supportedNetworks[network].has(symbol)) {
    return supportedNetworks[network].get(symbol);
  }
  for (network of Object.keys(supportedNetworks)) {
    if (supportedNetworks[network].has(symbol)) {
      return supportedNetworks[network].get(symbol);
    }
  }

  return;
}

/**
 * Get the amount of decimals for an ERC20 currency
 *
 * @param currency The ERC20 Currency object
 * @returns The number of decimals for the ERC20 currency
 */
export function getErc20Decimals(currency: RequestLogicTypes.ICurrency): number {
  const network = currency.network || 'mainnet';
  let erc20Token;

  // Get the decimals from one of the supported ERC20 networks
  if (network in supportedNetworksDetails) {
    erc20Token = Object.values(supportedNetworksDetails[network]).find(
      ({ address }) => address.toLowerCase() === currency.value.toLowerCase(),
    );
  }

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
  const network = currency.network || 'mainnet';

  if (currency.type !== RequestLogicTypes.CURRENCY.ERC20) {
    throw new Error('Can only get symbol for ERC20 currencies');
  }

  // Find ERC20 symbol in one of the other supported ERC20 networks
  if (network in supportedNetworks) {
    const entry = [...supportedNetworks[network].entries()].find(
      ([, obj]) => currency.value.toLowerCase() === obj.value.toLowerCase(),
    );
    return entry ? entry[0] : null;
  }

  return null;
}

interface ERC20TokenDetails extends ERC20SymbolDetails {
  symbol: string;
}

/**
 * Returns a list of supported ERC20 tokens
 *
 * @returns List of supported ERC20 tokens
 */
export function getSupportedERC20Tokens(): ERC20TokenDetails[] {
  return Object.entries(supportedNetworksDetails).reduce(
    (acc: ERC20TokenDetails[], [networkName, supportedCurrencies]) => {
      return [
        ...acc,
        ...Object.entries(supportedCurrencies).map(([symbol, token]) => ({
          ...token,
          symbol: `${symbol}${networkName !== 'mainnet' ? `-${networkName}` : ''}`,
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
  return Object.entries(supportedNetworksDetails).reduce(
    (acc: RequestLogicTypes.ICurrency[], [networkName, supportedCurrencies]) => {
      return [
        ...acc,
        ...Object.entries(supportedCurrencies).map(([, token]) => ({
          network: networkName,
          value: token.address,
          type: RequestLogicTypes.CURRENCY.ERC20,
        })),
      ];
    },
    [],
  );
}
