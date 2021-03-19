import { ethers } from 'ethers';

let configuration = {
  // fallback to Ethers v4 default projectId
  infura: process.env.RN_INFURA_KEY || '7d0d81d0919f4f05b9ab6634be01ee73',
};

export const initPaymentDetectionProvider = (config: Partial<typeof configuration>) => {
  configuration = { ...configuration, ...config };
};

export const getDefaultProvider = (network?: string | ethers.providers.Network | undefined) => {
  if (network === 'private') {
    return new ethers.providers.JsonRpcProvider();
  }
  if (configuration.infura) {
    return new ethers.providers.InfuraProvider(network, process.env.RN_INFURA_KEY);
  }

  return ethers.getDefaultProvider(network);
};
