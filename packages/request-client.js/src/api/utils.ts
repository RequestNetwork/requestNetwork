import { RequestLogicTypes } from '@requestnetwork/types';
import Utils from '@requestnetwork/utils';
import { getDecimals } from './payment-network/erc20/info-retriever';

/**
 * Collection of utils functions related to the library, meant to simplify its use.
 */
export default {
  /**
   * Returns the number of decimals for a currency
   *
   * @param currency The currency
   * @returns The number of decimals
   */
  async getDecimalsForCurrency(currency: RequestLogicTypes.ICurrency): Promise<number> {
    // TODO: when we create a local list of "supported ERC20", we should fetch it from the list first
    // For ERC20 currencies we have to check the decimals with the smart contract
    if (currency.type === RequestLogicTypes.CURRENCY.ERC20) {
      return getERC20Decimals(currency.value, currency.network);
    }
    const decimals = {
      [RequestLogicTypes.CURRENCY.ETH]: 18,
      [RequestLogicTypes.CURRENCY.BTC]: 8,
      [RequestLogicTypes.CURRENCY.ISO4217]: 2,
    }[currency.type];

    if (!decimals) {
      throw new Error(`Currency ${currency} not implemented`);
    }
    return Promise.resolve(decimals);
  },
  /**
   * Returns the current timestamp in second
   *
   * @returns current timestamp in second
   */
  getCurrentTimestampInSecond: Utils.getCurrentTimestampInSecond,
};

/**
 * Returns the amount of decimals for an ERC20 token
 *
 * @param address The ERC20 contract address
 * @param network The ERC20 contract network
 * @returns The number of decimals
 */
async function getERC20Decimals(address: string, network: string = 'mainnet'): Promise<number> {
  return getDecimals(address, network);
}
