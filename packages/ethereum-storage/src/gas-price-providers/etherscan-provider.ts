import EthereumUtils from '../ethereum-utils';

import { StorageTypes } from '@requestnetwork/types';

import Axios from 'axios';

import { BigNumber } from 'ethers';
import { retry } from '@requestnetwork/utils';

// Maximum number of api requests to retry when an error is encountered (ECONNRESET, EPIPE, ENOTFOUND)
const ETHERSCAN_REQUEST_MAX_RETRY = 3;

// Delay between retries in ms
const ETHERSCAN_REQUEST_RETRY_DELAY = 100;

// Multiplier to use to convert the gas price in wei
const API_MULTIPLIER = 1000000000;

/**
 * Retrieves and processes the gas price returned by etherscan.io API
 */
export default class EtherscanProvider implements StorageTypes.IGasPriceProvider {
  /**
   * Url to connect to the provider API
   */
  public providerUrl = 'https://api.etherscan.io/api?module=gastracker&action=gasoracle';

  /**
   * Gets gas price from etherscan.io API
   *
   * @param type Type of the gas price (fast, standard or safe low)
   * @returns Requested gas price
   */
  public async getGasPrice(type: StorageTypes.GasPriceType): Promise<BigNumber | null> {
    const res = await retry(async () => Axios.get(this.providerUrl), {
      maxRetries: ETHERSCAN_REQUEST_MAX_RETRY,
      retryDelay: ETHERSCAN_REQUEST_RETRY_DELAY,
    })();

    // eslint-disable-next-line no-magic-numbers
    if (res.status >= 400) {
      throw new Error(
        `Etherscan error ${res.status}. Bad response from server ${this.providerUrl}`,
      );
    }
    const apiResponse = res.data;

    if (apiResponse.status && apiResponse.status !== '1') {
      throw new Error(`Etherscan error: ${apiResponse.message} ${apiResponse.result}`);
    }

    const { result } = apiResponse;

    // Check if the API response has the correct format
    if (
      !result ||
      !result.FastGasPrice ||
      !result.ProposeGasPrice ||
      !result.SafeGasPrice ||
      isNaN(result.FastGasPrice) ||
      isNaN(result.ProposeGasPrice) ||
      isNaN(result.SafeGasPrice)
    ) {
      throw new Error(`Etherscan API response doesn't contain the correct format`);
    }

    // Retrieve the gas price from the provided gas price type and the format of the API response
    const apiGasPrice = BigNumber.from(
      parseInt(
        {
          [StorageTypes.GasPriceType.FAST]: result.FastGasPrice,
          [StorageTypes.GasPriceType.STANDARD]: result.ProposeGasPrice,
          [StorageTypes.GasPriceType.SAFELOW]: result.SafeGasPrice,
        }[type],
        10,
      ) * API_MULTIPLIER,
    );

    if (!EthereumUtils.isGasPriceSafe(apiGasPrice)) {
      throw Error(`Etherscan provided gas price not safe to use: ${apiGasPrice}`);
    }

    return apiGasPrice;
  }
}
