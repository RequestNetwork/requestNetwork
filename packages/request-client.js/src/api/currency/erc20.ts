import { RequestLogicTypes } from '@requestnetwork/types';
import { utils } from 'ethers';

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

const supportedERC20Tokens = require('eth-contract-metadata') as ITokenMap;

// List of the supported rinkeby ERC20 tokens
export const supportedRinkebyERC20 = new Map([
  // Request Central Bank token, used for testing on rinkeby.
  [
    'CTBK',
    {
      network: 'rinkeby',
      type: RequestLogicTypes.CURRENCY.ERC20,
      value: '0x995d6a8c21f24be1dd04e105dd0d83758343e258',
    },
  ],

  // Faucet Token on rinkeby network. Easy to use on tests.
  [
    'FAU',
    {
      network: 'rinkeby',
      type: RequestLogicTypes.CURRENCY.ERC20,
      value: '0xFab46E002BbF0b4509813474841E0716E6730136',
    },
  ],
]);

// Additional details about the supported rinkeby ERC20 tokens.
const supportedRinkebyERC20Details = {
  // Request Central Bank token, used for testing on rinkeby.
  CTBK: {
    // Faucet URL: https://central.request.network
    address: '0x995d6a8c21f24be1dd04e105dd0d83758343e258',
    decimals: 18,
    name: 'Central Bank Token',
  },
  // Faucet Token on rinkeby network.
  FAU: {
    // Faucet URL: https://erc20faucet.com/
    address: '0xFab46E002BbF0b4509813474841E0716E6730136',
    decimals: 18,
    name: 'Faucet Token',
  },
};

/**
 * Returns a Currency object for an ERC20, if found
 * @param symbol The ERC20 token symbol
 * @param network The ERC20 contract network
 */
export function getErc20Currency(
  symbol: string,
  network: string,
): RequestLogicTypes.ICurrency | undefined {
  // If network is mainnet, check if it's one of the supported ERC20
  if (!network || network === 'mainnet') {
    const erc20Token = getErc20FromSymbol(symbol);
    if (erc20Token) {
      return {
        network: 'mainnet',
        type: RequestLogicTypes.CURRENCY.ERC20,
        value: erc20Token.address,
      };
    }
  }

  // Check if it's one of our supported rinkeby ERC20 currencies
  if (supportedRinkebyERC20.has(symbol)) {
    if (network && network === 'rinkeby') {
      return supportedRinkebyERC20.get(symbol)!;
    }
    throw new Error(`The currency ${symbol} is only available on rinkeby`);
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
  let erc20Token;
  // Get the decimals from the supported mainnet ERC20
  if (!currency.network || currency.network === 'mainnet') {
    erc20Token = getMainnetErc20FromAddress(currency.value);
  }

  // Get the decimals from the supported rinkeby ERC20
  if (currency.network === 'rinkeby') {
    erc20Token = Object.values(supportedRinkebyERC20Details).find(
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
 * Get an ERC20 currency from the currency address
 *
 * @param address the ERC20 currency address
 * @returns the ERC20 ITokenDescription
 */
export function getMainnetErc20FromAddress(address: string): ITokenDescription | undefined {
  const checksumAddress = utils.getAddress(address);
  const token = supportedERC20Tokens[checksumAddress];
  if (!token || !token.erc20) {
    return undefined;
  }
  return { ...token, address: checksumAddress };
}

/**
 * Get an ERC20 currency from the currency value string
 *
 * @param symbol the ERC20 currency symbol string
 * @returns the ERC20 ITokenDescription
 */
export function getErc20FromSymbol(symbol: string): ITokenDescription | undefined {
  const token = Object.entries(supportedERC20Tokens).find(
    ([_, tokenObject]) => tokenObject.symbol === symbol && tokenObject.erc20,
  );
  if (!token) {
    return;
  }
  return { ...token[1], address: token[0] };
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
  if (currency.type !== RequestLogicTypes.CURRENCY.ERC20) {
    throw new Error('Can only get symbol for ERC20 currencies');
  }
  const checksumAddress = utils.getAddress(currency.value);
  if (!currency.network || currency.network === 'mainnet') {
    const token = supportedERC20Tokens[checksumAddress];
    return token ? token.symbol : null;
  }

  if (currency.network === 'rinkeby') {
    const entry = [...supportedRinkebyERC20.entries()].find(
      ([, obj]) => currency.value === obj.value,
    );
    return entry ? entry[0] : null;
  }

  return null;
}

/**
 * Returns a list of supported ERC20 currencies
 *
 * @returns List of supported ERC20 currencies
 */
export function getSupportedERC20Tokens(): Array<{
  name: string;
  symbol: string;
  decimals: number;
  address: string;
}> {
  return Object.entries(supportedERC20Tokens)
    .filter(([, { erc20 }]) => !!erc20)
    .map(([address, { name, symbol, decimals }]) => ({ name, symbol, decimals, address }))
    .concat(
      Object.entries(supportedRinkebyERC20Details).map(([symbol, token]) => ({
        ...token,
        symbol: symbol + '-rinkeby',
      })),
    );
}
