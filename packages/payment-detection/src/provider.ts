import { ethers, providers } from 'ethers';

let defaultProviderOptions: Record<string, string> = {
  // fallback to Ethers v4 default projectId
  infura: process.env.RN_INFURA_KEY || '7d0d81d0919f4f05b9ab6634be01ee73',
};

let blockchainRpcs: Record<string, string> = {
  private: providers.JsonRpcProvider.defaultUrl(),
  matic: 'https://rpc-mainnet.matic.network/',
};

export const initPaymentDetectionProvider = (overrides: {
  /** RPC URL per network */
  blockchainRpcs?: Record<string, string>;
  /** Default Provider Options as specified in https://docs.ethers.io/v5/api/providers/#providers-getDefaultProvider  */
  defaultProviderOptions?: Record<string, string>;
}): void => {
  blockchainRpcs = { ...blockchainRpcs, ...overrides.blockchainRpcs };
  defaultProviderOptions = { ...defaultProviderOptions, ...overrides.defaultProviderOptions };
};

export const getDefaultProvider = (
  network?: string | ethers.providers.Network | undefined,
  options?: Record<string, string>,
): providers.Provider => {
  const defaultOptions = { ...defaultProviderOptions, ...options };
  if (typeof network === 'string') {
    const rpc = blockchainRpcs[network];
    if (rpc) {
      return ethers.getDefaultProvider(rpc, defaultOptions);
    }
  }

  return ethers.getDefaultProvider(network, defaultOptions);
};
