/**
 * Utility methods to categorize known chain ecosystems (EVM compatibles, Near, etc.)
 */

export const isNearNetwork = (network?: string): boolean => {
  return isNearMainNetwork(network) || isNearTestNetwork(network);
};

export const isNearMainNetwork = (network?: string): boolean => {
  return !!network && ['near', 'aurora'].includes(network);
};

export const isNearTestNetwork = (network?: string): boolean => {
  return !!network && ['near-testnet', 'aurora-testnet'].includes(network);
};

export const isSameNetwork = (network1: string, network2: string): boolean => {
  return (
    network1 === network2 ||
    (isNearMainNetwork(network1) && isNearMainNetwork(network2)) ||
    (isNearTestNetwork(network1) && isNearTestNetwork(network2))
  );
};
