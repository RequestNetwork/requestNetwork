import { StorageTypes } from '@requestnetwork/types';

import { axios, retry } from '@requestnetwork/utils';
import { isGasPriceSafe } from '../ethereum-utils';


/**
 * Retrieves and processes the gas price returned by any API
 */
export default abstract class BaseGasPriceProvider implements StorageTypes.IGasPriceProvider {

  constructor(private readonly name: string, private readonly providerUrl: `https://${string}`) { }

  public abstract parseResponse(type: StorageTypes.GasPriceType, response: unknown): bigint;

  /**
   * @param type Type of the gas price (fast, standard or safe low)
   * @returns Requested gas price
   */
  public async getGasPrice(type: StorageTypes.GasPriceType): Promise<bigint | null> {
    const res = await retry(axios, { maxRetries: 3, retryDelay: 100, })(this.providerUrl);

    // eslint-disable-next-line no-magic-numbers
    if (res.status >= 400) {
      throw new Error(
        `${this.name} error ${res.status}. Bad response from server ${this.providerUrl}`,
      );
    }

    if (!res.data) {
      throw new Error(`${this.name} API didn't return a response`);
    }

    const apiGasPrice = this.parseResponse(type, res.data)

    if (!apiGasPrice) {
      throw new Error(`${this.name} API doesn't contain the correct format`);
    }
    if (!isGasPriceSafe(apiGasPrice)) {
      throw Error(`${this.name} provided gas price not safe to use: ${apiGasPrice}`);
    }

    return apiGasPrice;
  }
}
