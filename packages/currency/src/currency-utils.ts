/**
 * Checks if a Near address is valid according to a currency network.
 * Returns true if the currency network is not given and the address is correct for any network.
 */
export const isValidNearAddress = (address: string, network?: string): boolean => {
  if (!network) {
    return isValidNearAddress(address, 'aurora') || isValidNearAddress(address, 'aurora-testnet');
  }
  if (!address.match(/^(([a-z\d]+[-_])*[a-z\d]+\.)*([a-z\d]+[-_])*[a-z\d]+$/)) {
    return false;
  }
  switch (network) {
    case 'aurora':
      return !!address.match(/\.near$/);
    case 'aurora-testnet':
      return !!address.match(/\.testnet$/);
    default:
      throw new Error(`Cannot validate NEAR address for network ${network}`);
  }
};
