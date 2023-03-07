import { StorageTypes } from '@requestnetwork/types';

import Axios from 'axios';

import { BigNumber } from 'ethers';
import { retry } from '@requestnetwork/utils';
import { isGasPriceSafe } from '../ethereum-utils';

// Maximum number of api requests to retry when an error is encountered (ECONNRESET, EPIPE, ENOTFOUND)
const ETHERCHAIN_REQUEST_MAX_RETRY = 3;

// Delay between retries in ms
const ETHERCHAIN_REQUEST_RETRY_DELAY = 100;

// Multiplier to use to convert the gas price in wei
const API_MULTIPLIER = 1000000000;

/**
 * Retrieves and processes the gas price returned by etherchain.org API
 */
export default class EtherchainProvider implements StorageTypes.IGasPriceProvider {
  /**
   * Url to connect to the provider API
   */
  public providerUrl = 'https://www.etherchain.org/api/gasPriceOracle';

  /**
   * Gets gas price from etherchain.org API
   *
   * @param type Type of the gas price (fast, standard or safe low)
   * @returns Requested gas price
   */
  public async getGasPrice(type: StorageTypes.GasPriceType): Promise<BigNumber | null> {
    const res = await retry(async () => Axios.get(this.providerUrl), {
      maxRetries: ETHERCHAIN_REQUEST_MAX_RETRY,
      retryDelay: ETHERCHAIN_REQUEST_RETRY_DELAY,
    })();

    // eslint-disable-next-line no-magic-numbers
    if (res.status >= 400) {
      throw new Error(
        `Etherchain error ${res.status}. Bad response from server ${this.providerUrl}`,
      );
    }
    const apiResponse = res.data;

    // Check if the API response has the correct format
    if (
      !apiResponse.fast ||
      !apiResponse.standard ||
      !apiResponse.safeLow ||
      isNaN(apiResponse.fast) ||
      isNaN(apiResponse.standard) ||
      isNaN(apiResponse.safeLow)
    ) {
      throw new Error(`Etherchain API response doesn't contain the correct format`);
    }

    // Retrieve the gas price from the provided gas price type and the format of the API response
    const apiGasPrice = BigNumber.from(
      parseFloat(
        {
          [StorageTypes.GasPriceType.FAST]: apiResponse.fast,
          [StorageTypes.GasPriceType.STANDARD]: apiResponse.standard,
          [StorageTypes.GasPriceType.SAFELOW]: apiResponse.safeLow,
        }[type],
      ) * API_MULTIPLIER,
    );

    if (!isGasPriceSafe(apiGasPrice)) {
      throw Error(`Etherchain provided gas price not safe to use: ${apiGasPrice}`);
    }

    return apiGasPrice;
  }
}
