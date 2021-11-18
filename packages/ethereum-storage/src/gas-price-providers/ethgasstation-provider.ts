import EthereumUtils from '../ethereum-utils';

import { StorageTypes } from '@requestnetwork/types';
import Utils from '@requestnetwork/utils';
import Axios from 'axios';

import { BigNumber } from 'ethers';

// Maximum number of api requests to retry when an error is encountered (ECONNRESET, EPIPE, ENOTFOUND)
const ETHGASSTATION_REQUEST_MAX_RETRY = 3;

// Delay between retries in ms
const ETHGASSTATION_RETRY_DELAY = 100;

// Multiplier to use to convert the gas price in wei
const API_MULTIPLIER = 100000000;

/**
 * Retrieve and process the gas price returned by ethgasstation.org API
 */
export default class EthGasStationProvider implements StorageTypes.IGasPriceProvider {
  /**
   * Url to connect to the provider API
   */
  public providerUrl = 'https://ethgasstation.info/json/ethgasAPI.json';

  /**
   * Gets gas price from ethgasstation.org API
   *
   * @param type Type of the gas price (fast, standard or safe low)
   * @returns Requested gas price
   */
  public async getGasPrice(type: StorageTypes.GasPriceType): Promise<BigNumber | null> {
    const res = await Utils.retry(async () => Axios.get(this.providerUrl), {
      maxRetries: ETHGASSTATION_REQUEST_MAX_RETRY,
      retryDelay: ETHGASSTATION_RETRY_DELAY,
    })();

    // eslint-disable-next-line no-magic-numbers
    if (res.status >= 400) {
      throw new Error(
        `EthGasStation error ${res.status}. Bad response from server ${this.providerUrl}`,
      );
    }
    const apiResponse = res.data;

    // Check if the API response has the correct format
    if (
      !apiResponse.fast ||
      !apiResponse.average ||
      !apiResponse.safeLow ||
      isNaN(apiResponse.fast) ||
      isNaN(apiResponse.average) ||
      isNaN(apiResponse.safeLow)
    ) {
      throw new Error(`EthGasStation API response doesn't contain the correct format`);
    }

    // Retrieve the gas price from the provided gas price type and the format of the API response
    const apiGasPrice = BigNumber.from(
      parseFloat(
        {
          [StorageTypes.GasPriceType.FAST]: apiResponse.fast,
          [StorageTypes.GasPriceType.STANDARD]: apiResponse.average,
          [StorageTypes.GasPriceType.SAFELOW]: apiResponse.safeLow,
        }[type],
      ) * API_MULTIPLIER,
    );

    if (!EthereumUtils.isGasPriceSafe(apiGasPrice)) {
      throw Error(`EthGasStation provided gas price not safe to use: ${apiGasPrice}`);
    }

    return apiGasPrice;
  }
}
