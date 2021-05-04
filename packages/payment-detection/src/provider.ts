import { ethers, providers } from 'ethers';

let defaultProviderOptions: Record<string, string> = {
  // fallback to Ethers v4 default projectId
  infura: process.env.RN_INFURA_KEY || '7d0d81d0919f4f05b9ab6634be01ee73',
};

let blockchainRpcs: Record<string, string> = {
  matic: 'https://rpc-mainnet.matic.network/',
};

export const initPaymentDetectionProvider = (overrides: {
  /** */
  blockchainRpcs?: Record<string, string>;
  /** Options as specified in https://docs.ethers.io/v5/api/providers/#providers-getDefaultProvider  */
  defaultProviderOptions?: Record<string, string>;
}): void => {
  blockchainRpcs = { ...blockchainRpcs, ...overrides.blockchainRpcs };
  defaultProviderOptions = { ...defaultProviderOptions, ...overrides.defaultProviderOptions };
};

export const getDefaultProvider = (
  network?: string | ethers.providers.Network | undefined,
  options?: Record<string, string>,
): providers.Provider => {
  if (typeof network === 'string') {
    const rpc = blockchainRpcs[network];
    if (rpc) {
      return new providers.JsonRpcProvider(rpc);
    }
  }

  return ethers.getDefaultProvider(network, { ...defaultProviderOptions, ...options });
};
