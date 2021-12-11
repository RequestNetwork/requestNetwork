import {
  DefenderRelayProvider,
  DefenderRelaySigner,
  DefenderRelaySignerOptions,
} from 'defender-relay-client/lib/ethers';

export const getRelayerSigner = (
  credentials: {
    apiKey: string;
    apiSecret: string;
  },
  options?: DefenderRelaySignerOptions,
): DefenderRelaySigner => {
  const provider = new DefenderRelayProvider(credentials);
  return new DefenderRelaySigner(credentials, provider, options);
};
