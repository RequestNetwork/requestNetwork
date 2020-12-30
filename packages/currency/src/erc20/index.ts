import { RequestLogicTypes } from '@requestnetwork/types';
import { utils } from 'ethers';
import { supportedNetworks, supportedNetworksDetails, ERC20SymbolDetails } from './networks';

/**
 * Returns a Currency object for an ERC20, if found
 * @param symbol The ERC20 token symbol
 * @param network The ERC20 contract network
 */
export function getErc20Currency(
  symbol: string,
  network: string = 'mainnet',
): RequestLogicTypes.ICurrency | undefined {
  // Check if it's on one of the other supported networks
  if (supportedNetworks.hasOwnProperty(network) && supportedNetworks[network].has(symbol)) {
    return supportedNetworks[network].get(symbol);
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
  if (supportedNetworksDetails.hasOwnProperty(network)) {
    erc20Token = Object.values(supportedNetworksDetails[network]).find(
      ({ address }) => address === currency.value,
    );
  }

  if (erc20Token) {
    return erc20Token.decimals;
  }

  // If no supported ERC20 is found, throw error
  throw new Error(`Unsupported ERC20 address: ${currency.value}`);
}

/**
 * Returns true if the address is a valid checksum address
 *
 * @param address The address to validate
 * @returns If the address is valid or not
 */
export function validERC20Address(address: string): boolean {
  return utils.getAddress(address) === address;
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
  if (supportedNetworks.hasOwnProperty(network)) {
    const entry = [...supportedNetworks[network].entries()].find(
      ([, obj]) => currency.value === obj.value,
    );
    return entry ? entry[0] : null;
  }

  return null;
}

interface ERC20TokenDetails extends ERC20SymbolDetails {
  symbol: string;
}
/**
 * Returns a list of supported ERC20 currencies
 *
 * @returns List of supported ERC20 currencies
 */
export function getSupportedERC20Tokens(): ERC20TokenDetails[] {
  return Object.entries(supportedNetworksDetails).reduce(
    (acc: ERC20TokenDetails[], [networkName, network]) => {
      return [
        ...acc,
        ...Object.entries(network).map(([symbol, token]) => ({
          ...token,
          symbol: `${symbol}${networkName !== 'mainnet' ? `-${networkName}` : ''}`,
        })),
      ];
    },
    [],
  );
}
