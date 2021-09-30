/**
 * Checks if a Near address is valid according to a currency network.
 * Returns true if the currency network is not given and the address is correct for any network.
 */
export const isValidNearAddress = (address: string, network?: string): boolean => {
  if (!network) {
    return isValidNearAddress(address, 'aurora') || isValidNearAddress(address, 'aurora-testnet');
  }
  if (network === 'aurora') {
    return !!address.match(/\.near$/);
  }
  if (network === 'aurora-testnet') {
    return !!address.match(/\.testnet$/);
  }
  return false;
};
