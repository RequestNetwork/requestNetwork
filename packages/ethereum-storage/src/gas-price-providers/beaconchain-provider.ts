import { StorageTypes } from '@requestnetwork/types';

import BaseGasPriceProvider from './base-gas-price-provider';

// Multiplier to use to convert the gas price in wei
const API_MULTIPLIER = 1000000000n;

type BeaconChainGasNowResponse = {
  "code": number;
  "data": {
    "rapid": number;
    "fast": number;
    "standard": number;
    "slow": number;
    "timestamp": number;
    "priceUSD": number;
  }
}

const map: Record<StorageTypes.GasPriceType, keyof BeaconChainGasNowResponse["data"]> = {
  fast: "fast",
  standard: "standard",
  safeLow: "slow"
}

/**
 * Retrieves and processes the gas price returned by beaconcha.in API
 */
export default class BeaconchainProvider extends BaseGasPriceProvider {
  constructor() {
    super("Beaconchain", 'https://beaconcha.in/api/v1/execution/gasnow')
  }

  public parseResponse(type: StorageTypes.GasPriceType, response: BeaconChainGasNowResponse): bigint {
    // Retrieve the gas price from the provided gas price type and the format of the API response
    const apiGasPrice = BigInt(response.data[map[type]]) * API_MULTIPLIER;
    return apiGasPrice;
  }
}

